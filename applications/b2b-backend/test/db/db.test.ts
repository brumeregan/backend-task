import { toMoney, CardSchema, InvoiceSchema, TransactionSchema, UserSchema, CompanySummarySchema } from '@qred/b2b-app-schemas';
import { UniqueConstraintError } from 'sequelize';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedIds } from '../../src/db';
import {
  toCardDto,
  toCompanySummaryDto,
  toInvoiceDto,
  toUserDto,
  toTransactionDto,
} from '../../src/services/mappers';
import { createMigrator } from '../../src/db/migrator';
import { seed } from '../../src/db/seed';
import { createTestApp } from '../helpers';
import type { TestDb } from '../helpers';

const APP_TABLES = [
  'users', 
  'companies', 
  'company_memberships', 
  'accounts', 
  'cards',
  'spend_limits', 
  'transactions', 
  'invoices', 
  'audit_log',
];

describe('database', () => {
  let db: TestDb;

  beforeAll(async () => {
    ({ db } = await createTestApp());
  });
  
  afterAll(async () => {
    await db.close();
  });

  const tables = async () =>
    (await db.sequelize.getQueryInterface().showAllTables()).map(String);

  // Runs first: it leaves the schema migrated and seeded again for the tests below.
  it('migrations apply cleanly and revert with down', async () => {
    expect(await tables()).toEqual(expect.arrayContaining(APP_TABLES));

    const migrator = createMigrator(db.sequelize);
    
    await migrator.down({ to: 0 });
    
    expect(await tables()).not.toContain('users');
    
    await migrator.up();
    
    expect(await tables()).toEqual(expect.arrayContaining(APP_TABLES));
    expect(await migrator.pending()).toEqual([]);
    
    await seed(db.models);
  });

  it('seed is idempotent', async () => {
    const before = await db.models.Transaction.count();
    
    expect(await seed(db.models)).toBe(false);
    expect(await db.models.Transaction.count()).toBe(before);
    expect(await db.models.User.count()).toBe(3);
    expect(before).toBeGreaterThanOrEqual(30);
  });

  it('loads associations', async () => {
    const { User, Card } = db.models;
    const card = await Card.findByPk(seedIds.cards.annaInactive, {
      include: [{ association: 'account', include: [{ association: 'company' }] }],
    });
    
    expect(card?.account?.company?.legalName).toBe('Company AB');

    const anna = await User.findByPk(seedIds.users.anna, { include: ['companies'] });
    const sara = await User.findByPk(seedIds.users.sara, { include: ['companies'] });
    
    expect(anna?.companies).toHaveLength(2);
    expect(sara?.companies).toHaveLength(1);
  });

  it('rejects a spend limit with both or neither target', async () => {
    const { SpendLimit } = db.models;
    const base = { amount: 100, period: 'monthly' as const, createdBy: seedIds.users.anna };
    
    await expect(
      SpendLimit.create({ ...base, cardId: seedIds.cards.erikActive, accountId: seedIds.accounts.companyAb }),
    ).rejects.toThrow();
    await expect(SpendLimit.create(base)).rejects.toThrow();
  });

  it('enforces the XOR check in the database as well', async () => {
    await expect(
      db.sequelize.query(
        `INSERT INTO spend_limits (id, amount, period, created_by, created_at, updated_at)
         VALUES (gen_random_uuid(), 1, 'total', '${seedIds.users.anna}', now(), now())`,
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it('allows at most one limit per card', async () => {
    const card = seedIds.cards.erikActive;
    const insert = () =>
      db.sequelize.query(
        `INSERT INTO spend_limits (id, card_id, amount, period, created_by, created_at, updated_at)
         VALUES (gen_random_uuid(), '${card}', 1, 'total', '${seedIds.users.erik}', now(), now())`,
      );
    
    await insert();
    await expect(insert()).rejects.toBeInstanceOf(UniqueConstraintError);
    await db.sequelize.query(`DELETE FROM spend_limits WHERE card_id = '${card}'`);
  });

  // Raw SQL skips the model validations: these are the database's own CHECKs (see 0001-init).
  it.each([
    ['card status', `UPDATE cards SET status = 'bogus'`],
    ['card last4', `UPDATE cards SET last4 = '12a4'`],
    ['card expiry month', `UPDATE cards SET expiry_month = 13`],
    ['transaction status', `UPDATE transactions SET status = 'bogus'`],
    ['invoice status', `UPDATE invoices SET status = 'bogus'`],
    ['company status', `UPDATE companies SET status = 'bogus'`],
    ['billing day', `UPDATE accounts SET billing_day = 31`],
  ])('the database rejects an invalid %s', async (_name, query) => {
    await expect(db.sequelize.query(query)).rejects.toThrow(/check constraint/);
  });

  it('uses Postgres-native types and indexes', async () => {
    const audit = await db.sequelize.getQueryInterface().describeTable('audit_log');
    expect(audit.id?.type).toBe('BIGINT');
    expect(audit.metadata?.type).toBe('JSONB');
    const [rows] = await db.sequelize.query(
      "SELECT indexdef FROM pg_indexes WHERE indexname = 'transactions_card_id_authorized_at_id'",
    );
    expect((rows as { indexdef: string }[])[0]?.indexdef).toMatch(/\(card_id, authorized_at DESC, id DESC\)/);
  });

  it('rejects unknown statuses', async () => {
    const { Card, Transaction } = db.models;
    
    await expect(
      Card.create({
        accountId: seedIds.accounts.companyAb,
        cardholderUserId: seedIds.users.erik,
        issuerCardId: 'iss_bad',
        last4: '0000',
        expiryMonth: 1,
        expiryYear: 2030,
        status: 'bogus' as never,
      }),
    ).rejects.toThrow();
    
    await expect(
      Transaction.create({
        cardId: seedIds.cards.erikActive,
        status: 'bogus' as never,
        amount: 1,
        currency: 'SEK',
        authorizedAt: new Date(),
      }),
    ).rejects.toThrow();
  });

  it('maps models to DTOs that satisfy the shared schemas', async () => {
    const { Card, Transaction, Invoice, User, Company } = db.models;
    
    const card = await Card.findByPk(seedIds.cards.annaInactive, {
      include: ['cardholder', 'account'],
    });
    
    const cardDto = CardSchema.parse(toCardDto(card!, card!.account!));
    
    expect(cardDto.companyId).toBe(seedIds.companies.companyAb);
    expect(cardDto.status).toBe('inactive');

    const transactions = await Transaction.findAll();
    
    for (const tx of transactions) {
      TransactionSchema.parse(toTransactionDto(tx));
    }
    
    const foreign = transactions.find((tx) => tx.originalCurrency === 'EUR');
    
    expect(TransactionSchema.parse(toTransactionDto(foreign!)).originalAmount?.currency).toBe('EUR');

    const invoices = await Invoice.findAll();
    
    expect(invoices).toHaveLength(4);
    
    for (const invoice of invoices) {
      InvoiceSchema.parse(toInvoiceDto(invoice, 'SEK'));
    }

    const user = await User.findByPk(seedIds.users.anna);
    const userDto = UserSchema.parse(toUserDto(user!));
    
    expect(userDto).not.toHaveProperty('taxNumber');
    
    const company = await Company.findByPk(seedIds.companies.companyAb);
    
    CompanySummarySchema.parse(toCompanySummaryDto(company!));
  });

  it('converts BIGINT strings to numbers', async () => {
    // pg returns BIGINT as a string; the mappers must turn it into a number.
    const invoice = await db.models.Invoice.findByPk(seedIds.invoices.companyAbOpen);
    
    expect(typeof invoice!.getDataValue('total')).toBe('string');
    
    invoice!.setDataValue('total', '123400' as never);
    invoice!.setDataValue('paid', '400' as never);
    const dto = toInvoiceDto(invoice!, 'SEK');
    
    expect(dto.total).toEqual(toMoney(123400, 'SEK'));
    expect(dto.outstanding.amount).toBe(123000);
  });

  it('audit_log is append-only (no updated_at)', async () => {
    const columns = await db.sequelize.getQueryInterface().describeTable('audit_log');
    
    expect(columns).toHaveProperty('created_at');
    expect(columns).not.toHaveProperty('updated_at');
    
    const entry = await db.models.AuditLog.create({ action: 'card.frozen', actorId: seedIds.users.anna });
    
    expect(entry.get('updatedAt')).toBeUndefined();
  });
});
