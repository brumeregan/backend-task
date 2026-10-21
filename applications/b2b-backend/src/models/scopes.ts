import { Card } from "./card";
import type { Account } from "./account";
import type { Includeable, Transaction, WhereOptions } from "sequelize";

// THE tenant boundary. Every query that starts at an account-owned row (card, transaction,
// invoice, ...) includes this join: account -> company -> company_memberships(user_id = userId)
// with `required: true` (INNER JOINs). A row the caller has no membership for simply does not
// exist for them, so lookups return null (-> 404) and lists never contain foreign rows.
export const accountScope = (
  userId: string,
  options: { where?: WhereOptions<Account>; include?: Includeable[] } = {},
): Includeable => ({
  association: "account",
  required: true,
  ...(options.where ? { where: options.where } : {}),
  include: [
    {
      association: "company",
      required: true,
      // `id` is needed when a sibling include uses `separate: true`.
      attributes: ["id"],
      include: [
        {
          association: "memberships",
          required: true,
          attributes: [],
          where: { userId },
        },
      ],
    },
    ...(options.include ?? []),
  ],
});

// The same boundary for rows that hang off a card (transactions).
export const cardScope = (userId: string, accountOptions?: Parameters<typeof accountScope>[1]) => ({
  association: "card",
  required: true,
  attributes: ["id", "accountId"],
  include: [accountScope(userId, accountOptions)],
});

// A card that was loaded through findScopedCard. Mutations only ever receive this type, so they
// cannot run on an arbitrary id that skipped the membership check.
export type ScopedCard = Card & { account: Account };

export const asScopedCard = (card: Card | null): ScopedCard | null =>
  card && card.account ? (card as ScopedCard) : null;

// A fresh object per use: Sequelize mutates include options while resolving them.
const spendLimits = (): Includeable => ({ association: "spendLimits", separate: true, required: false });

// The only way to load a single card. `withLimits` adds the card's own and its account's spend
// limits in the same scoped lookup.
export const findScopedCard = async (
  userId: string,
  cardId: string,
  options: { withLimits?: boolean; transaction?: Transaction } = {},
): Promise<ScopedCard | null> =>
  asScopedCard(
    await Card.findOne({
      where: { id: cardId },
      include: [
        "cardholder",
        ...(options.withLimits ? [spendLimits()] : []),
        accountScope(userId, options.withLimits ? { include: [spendLimits()] } : {}),
      ],
      transaction: options.transaction,
      subQuery: false,
    }),
  );
