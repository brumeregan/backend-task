import { Op } from 'sequelize';
import { toTransactionDto } from './mappers';
import { notFound } from '../errors/httpError';
import { Transaction } from '../models';
import { cardScope, findScopedCard } from '../models/scopes';
import { pageInfo, pageOffset } from './pagination';
import type { TransactionListQuery } from '@qred/b2b-app-schemas';
import type { WhereOptions } from 'sequelize';

export const listTransactions = async (
  userId: string,
  companyId: string,
  query: TransactionListQuery,
) => {
  // DECISION: a cardId that is not a card of this company (or not visible to the caller)
  // is a 404 rather than a silently empty page, so a wrong filter is noticed.
  if (query.cardId) {
    const card = await findScopedCard(userId, query.cardId);

    if (!card || card.account.companyId !== companyId) {
      throw notFound('Card not found');
    }
  }

  const conditions: WhereOptions[] = [];

  if (query.cardId) {
    conditions.push({ cardId: query.cardId });
  }

  if (query.status) {
    conditions.push({ status: query.status });
  }

  const where = { [Op.and]: conditions };
  const include = [cardScope(userId, { where: { companyId } })];

  // Newest first; id breaks ties so pages never overlap or skip rows.
  const [transactions, totalCount] = await Promise.all([
    Transaction.findAll({
      where,
      include,
      order: [
        ['authorizedAt', 'DESC'],
        ['id', 'DESC'],
      ],
      limit: query.limit,
      offset: pageOffset(query),
      subQuery: false,
    }),
    Transaction.count({ where, include }),
  ]);

  return {
    data: transactions.map((tx) => toTransactionDto(tx)),
    page: pageInfo(query, totalCount),
  };
};

export const getTransaction = async (userId: string, transactionId: string) => {
  const transaction = await Transaction.findOne({
    where: { id: transactionId },
    include: [cardScope(userId)],
    subQuery: false,
  });

  if (!transaction) {
    throw notFound('Transaction not found');
  }
  
  return toTransactionDto(transaction);
};
