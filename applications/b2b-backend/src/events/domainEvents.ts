import { EventEmitter } from 'node:events';

export type DomainEvents = {
  'card.activated': { cardId: string; companyId: string; actorId: string };
  'card.frozen': { cardId: string; companyId: string; actorId: string };
  'card.unfrozen': { cardId: string; companyId: string; actorId: string };
  'limit.changed': { cardId: string; companyId: string; actorId: string };
};

export type DomainEventName = keyof DomainEvents;

// Stand-in for SNS/EventBridge. In production events would be written to an outbox table
// in the same DB transaction and relayed to the bus, so a crash between commit and publish
// cannot lose an event. Here: emitted in-process after commit.
const domainEvents = new EventEmitter();

export const emitDomainEvent = <N extends DomainEventName>(name: N, payload: DomainEvents[N]) => {
  domainEvents.emit(name, payload);
};
