import type { QueryInterface } from 'sequelize';

type Context = { context: QueryInterface };

// The whole schema as plain PostgreSQL DDL, one block per table, in dependency order.
// It follows the draft in TECH.md (see docs/ARCHITECTURE.md for the deviations).
//
// Conventions:
// - Money is BIGINT in minor units (öre). Never a float.
// - Business rules (statuses, ranges) are CHECKs, so they hold even for writes that skip the
//   models. The value lists are copied, not imported from the contract enums: a migration is
//   a snapshot, and widening an enum later is a new migration.
// - Every table has created_at/updated_at, except the append-only audit_log.
const SCHEMA = [
  // Natural persons. tax_number (personnummer) would be encrypted at rest in production.
  `CREATE TABLE users (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_number  text UNIQUE,
    email       text UNIQUE,
    first_name  text NOT NULL,
    last_name   text NOT NULL,
    phone       text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
  )`,

  // Legal entities ("Company AB").
  `CREATE TABLE companies (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_number  text NOT NULL UNIQUE,
    legal_name  text NOT NULL,
    status      text NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
  )`,

  // Who may see which company. THE tenant boundary: every scoped query joins through it.
  `CREATE TABLE company_memberships (
    user_id     uuid NOT NULL REFERENCES users (id),
    company_id  uuid NOT NULL REFERENCES companies (id),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, company_id)
  )`,
  // The PK covers lookups by user; this one covers lookups by company.
  `CREATE INDEX company_memberships_company_id ON company_memberships (company_id)`,

  // The credit agreement Qred grants a company.
  `CREATE TABLE accounts (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    uuid NOT NULL REFERENCES companies (id),
    credit_limit  bigint NOT NULL,
    currency      char(3) NOT NULL DEFAULT 'SEK',
    billing_day   smallint NOT NULL CHECK (billing_day BETWEEN 1 AND 28),
    status        text NOT NULL DEFAULT 'active',
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE cards (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          uuid NOT NULL REFERENCES accounts (id),
    cardholder_user_id  uuid NOT NULL REFERENCES users (id),
    issuer_card_id      text NOT NULL UNIQUE,
    last4               char(4) NOT NULL CHECK (last4 ~ '^[0-9]{4}$'),
    expiry_month        smallint NOT NULL CHECK (expiry_month BETWEEN 1 AND 12),
    expiry_year         smallint NOT NULL,
    status              text NOT NULL DEFAULT 'inactive'
                        CHECK (status IN ('inactive', 'active', 'frozen', 'blocked', 'expired')),
    activated_at        timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX cards_account_id ON cards (account_id)`,
  `CREATE INDEX cards_cardholder_user_id ON cards (cardholder_user_id)`,

  // A user-chosen cap below the credit limit,
  // either for one card or for the whole account (exactly one of the two).
  `CREATE TABLE spend_limits (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id     uuid REFERENCES cards (id),
    account_id  uuid REFERENCES accounts (id),
    amount      bigint NOT NULL CHECK (amount > 0),
    period      text NOT NULL CHECK (period IN ('monthly', 'total')),
    created_by  uuid NOT NULL REFERENCES users (id),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CHECK ((card_id IS NULL) <> (account_id IS NULL))
  )`,
  // At most one limit per card and one per account, so concurrent PUTs cannot create duplicates.
  `CREATE UNIQUE INDEX spend_limits_card_id_unique ON spend_limits (card_id) WHERE card_id IS NOT NULL`,
  `CREATE UNIQUE INDEX spend_limits_account_id_unique ON spend_limits (account_id) WHERE account_id IS NOT NULL`,

  // Monthly invoices. Created before transactions, which reference them.
  `CREATE TABLE invoices (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id    uuid NOT NULL REFERENCES accounts (id),
    period_start  date NOT NULL,
    period_end    date NOT NULL,
    total         bigint NOT NULL,
    paid          bigint NOT NULL DEFAULT 0,
    due_date      date NOT NULL,
    reference     text NOT NULL UNIQUE,
    status        text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('draft', 'open', 'paid', 'overdue', 'cancelled')),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
  )`,
  // The list and the "next invoice due" badge: per account, by due date.
  `CREATE INDEX invoices_account_id_due_date ON invoices (account_id, due_date)`,

  // One row per purchase, updated as it moves through its lifecycle.
  `CREATE TABLE transactions (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id                 uuid NOT NULL REFERENCES cards (id),
    status                  text NOT NULL
                            CHECK (status IN ('pending', 'cleared', 'declined', 'reversed', 'refunded')),
    amount                  bigint NOT NULL,
    currency                char(3) NOT NULL,
    original_amount         bigint,
    original_currency       char(3),
    merchant_name           text,
    merchant_category_code  char(4),
    merchant_country        char(2),
    decline_reason          text,
    authorized_at           timestamptz NOT NULL,
    cleared_at              timestamptz,
    invoice_id              uuid REFERENCES invoices (id),
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
  )`,
  // Transaction list: matches ORDER BY authorized_at DESC, id DESC exactly.
  `CREATE INDEX transactions_card_id_authorized_at_id ON transactions (card_id, authorized_at DESC, id DESC)`,

  // Who did what. Append-only and never pruned, hence bigserial.
  // metadata holds IDs, statuses and amounts only, never personal data.
  `CREATE TABLE audit_log (
    id           bigserial PRIMARY KEY,
    actor_id     uuid REFERENCES users (id),
    company_id   uuid REFERENCES companies (id),
    action       text NOT NULL,
    target_type  text,
    target_id    uuid,
    metadata     jsonb,
    created_at   timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX audit_log_company_id_created_at ON audit_log (company_id, created_at)`,
];

// Children first, so no foreign key blocks a drop.
const TABLES_DROP_ORDER = [
  'audit_log',
  'transactions',
  'invoices',
  'spend_limits',
  'cards',
  'accounts',
  'company_memberships',
  'companies',
  'users',
];

// DDL is transactional in Postgres: the schema is created completely or not at all.
export const up = async ({ context: qi }: Context) => {
  await qi.sequelize.transaction(async (transaction) => {
    for (const statement of SCHEMA) {
      await qi.sequelize.query(statement, { transaction });
    }
  });
};

export const down = async ({ context: qi }: Context) => {
  await qi.sequelize.query(`DROP TABLE ${TABLES_DROP_ORDER.join(', ')}`);
};
