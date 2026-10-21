import { toCardDto } from './mappers';
import { emitDomainEvent } from '../events/domainEvents';
import { conflict, notFound } from '../errors/httpError';
import { Card } from '../models';
import { accountScope, asScopedCard, findScopedCard } from '../models/scopes';
import { insertAuditLog } from './auditLog';
import { planTransition } from './cardStateMachine';
import type { CardAction } from './cardStateMachine';
import type { ScopedCard } from '../models/scopes';
import type { Sequelize } from 'sequelize';

const CARD_NOT_FOUND = 'Card not found';

const toDto = (card: ScopedCard) => toCardDto(card, card.account);

export const listCards = async (userId: string, companyId: string) => {
  const cards = await Card.findAll({
    include: ['cardholder', accountScope(userId, { where: { companyId } })],
    order: [
      ['createdAt', 'ASC'],
      ['id', 'ASC'],
    ],
    subQuery: false,
  });
  return {
    data: cards.flatMap((card) => {
      const scoped = asScopedCard(card);
      return scoped ? [toDto(scoped)] : [];
    }),
  };
};

export const getCard = async (userId: string, cardId: string) => {
  const card = await findScopedCard(userId, cardId);
  if (!card) {
    throw notFound(CARD_NOT_FOUND);
  }
  return toDto(card);
};

const auditActions = {
  activate: 'card.activated',
  freeze: 'card.frozen',
  unfreeze: 'card.unfrozen',
} as const;

// Runs a state change plus its audit row in ONE transaction; the domain event goes out
// only after the commit.
const changeCardState = async (
  database: Sequelize,
  userId: string,
  cardId: string,
  action: CardAction,
) => {
  const card = await database.transaction(async (transaction) => {
    const found = await findScopedCard(userId, cardId, { transaction });

    if (!found) {
      throw notFound(CARD_NOT_FOUND);
    }

    const plan = planTransition(action, found.status);

    if (plan.kind === 'conflict') {
      throw conflict(plan.reason);
    }

    const from = found.status;
    await found.update(
      { status: plan.to, ...(action === 'activate' ? { activatedAt: new Date() } : {}) },
      { transaction },
    );
    await insertAuditLog(
      userId,
      {
        action: auditActions[action],
        companyId: found.account.companyId,
        targetType: 'card',
        targetId: found.id,
        metadata: { from, to: plan.to },
      },
      transaction,
    );
    return found;
  });

  emitDomainEvent(auditActions[action], {
    cardId: card.id,
    companyId: card.account.companyId,
    actorId: userId,
  });
  return toDto(card);
};

// DECISION: no proof-of-possession check (e.g. last 4 digits). The API already returns last4,
// so it would prove nothing; real activation belongs to the card issuer.
export const activateCard = (database: Sequelize, userId: string, cardId: string) =>
  changeCardState(database, userId, cardId, 'activate');

export const freezeCard = (database: Sequelize, userId: string, cardId: string) =>
  changeCardState(database, userId, cardId, 'freeze');

export const unfreezeCard = (database: Sequelize, userId: string, cardId: string) =>
  changeCardState(database, userId, cardId, 'unfreeze');
