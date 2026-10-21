import type { CardStatus } from '@qred/b2b-app-schemas';

export type CardAction = 'activate' | 'freeze' | 'unfreeze';

export type TransitionPlan =
  | { kind: 'change'; to: CardStatus }
  | { kind: 'conflict'; reason: string };

// Explicit transition table: action -> (current status -> next status).
// Anything not listed is a conflict, including repeating an action (e.g. freezing a frozen card).
// blocked and expired are terminal for the user.
const transitions: Record<CardAction, Partial<Record<CardStatus, CardStatus>>> = {
  activate: { inactive: 'active' },
  freeze: { active: 'frozen' },
  unfreeze: { frozen: 'active' },
};

export const planTransition = (action: CardAction, current: CardStatus): TransitionPlan => {
  const next = transitions[action][current];

  if (next) {
    return { 
      kind: 'change',
      to: next 
    };
  }

  if (action === 'activate' && current === 'active') {
    return { 
      kind: 'conflict', 
      reason: 'Card is already active' 
    };
  }

  return { 
    kind: 'conflict', 
    reason: `Cannot ${action} a card that is ${current}` 
  };
};
