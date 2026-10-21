import { Op } from 'sequelize';
import { emitDomainEvent } from '../events/domainEvents';
import { notFound, unprocessable } from '../errors/httpError';
import { Invoice, SpendLimit, Transaction as TransactionModel } from '../models';
import { accountScope, cardScope, findScopedCard } from '../models/scopes';
import { insertAuditLog } from './auditLog';
import { billingPeriod, computeSpendLimit } from './spendLimitCalc';
import type { ScopedCard } from '../models/scopes';
import type { PutSpendLimitBody, SpendLimitPeriod, SpendLimitSource } from '@qred/b2b-app-schemas';
import type { AggregateOptions, Includeable, Sequelize, Transaction, WhereOptions } from 'sequelize';

// The newest row wins if there were ever several (the unique index allows only one today).
const newest = <T extends { updatedAt: Date }>(rows: T[]) =>
  [...rows].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] ?? null;

// Both need a card loaded with findScopedCard(..., { withLimits: true }).
const cardLimit = (card: ScopedCard) => newest(card.spendLimits ?? []);
const accountLimit = (card: ScopedCard) =>
  newest((card.account.spendLimits ?? []).filter((limit) => limit.accountId != null));

type Effective = {
  source: SpendLimitSource;
  amount: number;
  period: SpendLimitPeriod;
  scope: 'card' | 'account';
};

// Precedence: the card's own limit -> an account-wide limit -> the account credit limit.
const effectiveLimit = (card: ScopedCard): Effective => {
  const own = cardLimit(card);
  if (own) {
    return {
      source: 'card',
      amount: Number(own.amount),
      period: own.period,
      scope: 'card',
    };
  }

  const shared = accountLimit(card);

  if (shared) {
    return { 
      source: 'account', 
      amount: Number(shared.amount), 
      period: shared.period, 
      scope: 'account' 
    };
  }

  // The credit limit is not periodic: it is measured against everything currently owed.
  return {
    source: 'credit',
    amount: Number(card.account.creditLimit),
    period: 'total',
    scope: 'account',
  };
};

type SpendFilter = {
  accountId: string;
  cardId?: string;
  from?: Date;
  toExclusive?: Date;
  unbilledOnly?: boolean;
};

// Keeps the joins (and their WHERE) of an include tree, but selects no columns from them.
const withoutColumns = (include: Includeable): Includeable =>
  typeof include === 'object' && 'association' in include
    ? {
        ...include,
        attributes: [],
        ...(include.include ? { include: include.include.map(withoutColumns) } : {}),
      }
    : include;

// Sum of pending + cleared amounts (minor units), still joined through the membership scope.
const sumSpend = async (userId: string, filter: SpendFilter, transaction?: Transaction) => {
  const conditions: WhereOptions[] = [{ status: { [Op.in]: ['pending', 'cleared'] } }];

  if (filter.cardId) {
    conditions.push({ cardId: filter.cardId });
  }

  if (filter.unbilledOnly) {
    conditions.push({ invoiceId: null });
  }

  if (filter.from) {
    conditions.push({ authorizedAt: { [Op.gte]: filter.from } });
  }

  if (filter.toExclusive) {
    conditions.push({ authorizedAt: { [Op.lt]: filter.toExclusive } });
  }

  // Postgres rejects joined columns next to an aggregate, so the scope joins select nothing.
  // Model.sum() typings omit `include`, but aggregate() handles it like count() does.
  const options: AggregateOptions<number> & { include: Includeable[] } = {
    where: { 
      [Op.and]: conditions 
    },
    include: [withoutColumns(cardScope(userId, { 
      where: { 
        id: filter.accountId 
      } 
    }))],
    transaction,
  };
  // BIGINT sums can arrive as strings, and are null when nothing matches.
  const total: number | string | null = await TransactionModel.sum('amount', options);

  return Number(total ?? 0);
};

// Unpaid part of the account's issued invoices (they still occupy credit).
const sumOutstandingInvoices = async (userId: string, accountId: string, transaction?: Transaction) => {
  const invoices = await Invoice.findAll({
    where: { status: ['open', 'overdue'] },
    include: [accountScope(userId, { where: { id: accountId } })],
    transaction,
    subQuery: false,
  });

  return invoices.reduce((sum, i) => sum + (Number(i.total) - Number(i.paid)), 0);
};

const calculate = async (userId: string, card: ScopedCard, now: Date, transaction?: Transaction) => {
  const { account } = card;
  const effective = effectiveLimit(card);
  const billing = effective.period === 'monthly' ? billingPeriod(now, account.billingDay) : null;

  const [unbilled, outstanding] = await Promise.all([
    sumSpend(userId, { accountId: account.id, unbilledOnly: true }, transaction),
    sumOutstandingInvoices(userId, account.id, transaction),
  ]);

  const committedCredit = outstanding + unbilled;

  // For the credit fallback `used` is the credit currently occupied, so the figure matches
  // what the company actually owes and has not yet been invoiced.
  const used =
    effective.source === 'credit'
      ? committedCredit
      : await sumSpend(
          userId,
          {
            accountId: account.id,
            cardId: effective.scope === 'card' ? card.id : undefined,
            from: billing?.start,
            toExclusive: billing?.endExclusive,
          },
          transaction,
        );

  return computeSpendLimit({
    cardId: card.id,
    currency: account.currency,
    source: effective.source,
    period: effective.period,
    billing,
    limit: effective.amount,
    used,
    creditLimit: Number(account.creditLimit),
    committedCredit,
  });
};

export const getSpendLimit = async (userId: string, cardId: string, now: Date = new Date()) => {
  const card = await findScopedCard(userId, cardId, { 
    withLimits: true 
  });

  if (!card) {
    throw notFound('Card not found');
  }
  return calculate(userId, card, now);
};

export const putSpendLimit = async (
  database: Sequelize,
  userId: string,
  cardId: string,
  body: PutSpendLimitBody,
  now: Date = new Date(),
) => {
  const { card, result } = await database.transaction(async (transaction) => {
    const found = await findScopedCard(userId, cardId, { 
      withLimits: true, 
      transaction 
    });

    if (!found) {
      throw notFound('Card not found');
    }
    if (body.amount > Number(found.account.creditLimit)) {
      throw unprocessable('The limit cannot exceed the account credit limit');
    }

    // Create or update the card's own limit.
    const previous = cardLimit(found);
    const previousValue = previous ? { amount: Number(previous.amount), period: previous.period } : null;
    if (previous) {
      await previous.update(body, { transaction });
    } else {
      await SpendLimit.create({ cardId: found.id, createdBy: userId, ...body }, { transaction });
    }

    await insertAuditLog(
      userId,
      {
        action: 'limit.changed',
        companyId: found.account.companyId,
        targetType: 'card',
        targetId: found.id,
        metadata: { previous: previousValue, next: { amount: body.amount, period: body.period } },
      },
      transaction,
    );

    // Re-read inside the transaction so the response reflects the new limit.
    const fresh = await findScopedCard(userId, cardId, { withLimits: true, transaction });

    if (!fresh) {
      throw notFound('Card not found');
    }
    const result =  await calculate(userId, fresh, now, transaction);
    return { 
      card: fresh,
      result,
    };
  });

  emitDomainEvent('limit.changed', {
    cardId: card.id,
    companyId: card.account.companyId,
    actorId: userId,
  });
  
  return result;
};
