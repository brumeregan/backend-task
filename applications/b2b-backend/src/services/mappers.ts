import { toMoney } from "@qred/b2b-app-schemas";
import type {
  Card as CardDto,
  CompanySummary,
  Invoice as InvoiceDto,
  Transaction as TransactionDto,
  User as UserDto,
} from "@qred/b2b-app-schemas";
import type {
  Account,
  Card,
  Company,
  Invoice,
  Transaction,
  User,
} from "../models";

// pg returns BIGINT columns as strings: always Number().
const money = (amount: number | string, currency: string) =>
  toMoney(Number(amount), currency);

const iso = (date: Date | string) => new Date(date).toISOString();
const isoOrNull = (date: Date | string | null) => (date ? iso(date) : null);
// DATEONLY values are already 'YYYY-MM-DD'; slice guards against a Date sneaking in.
const day = (value: Date | string) =>
  typeof value === "string"
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);

// The card must be loaded with its `cardholder` association.
export const toCardDto = (
  card: Card,
  account: Pick<Account, "id" | "companyId">,
): CardDto => {
  const { cardholder } = card;
  if (!cardholder) {
    throw new Error("toCardDto: card.cardholder must be loaded");
  }
  return {
    id: card.id,
    companyId: account.companyId,
    accountId: account.id,
    cardholder: {
      id: cardholder.id,
      firstName: cardholder.firstName,
      lastName: cardholder.lastName,
    },
    last4: card.last4,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    status: card.status,
    activatedAt: isoOrNull(card.activatedAt),
    createdAt: iso(card.createdAt),
  };
};

// `currency` defaults to the transaction's own (account) currency.
export const toTransactionDto = (
  tx: Transaction,
  currency: string = tx.currency,
): TransactionDto => ({
  id: tx.id,
  cardId: tx.cardId,
  status: tx.status,
  amount: money(tx.amount, currency),
  originalAmount:
    tx.originalAmount != null && tx.originalCurrency
      ? money(tx.originalAmount, tx.originalCurrency)
      : null,
  merchant: {
    name: tx.merchantName,
    categoryCode: tx.merchantCategoryCode,
    country: tx.merchantCountry,
  },
  declineReason: tx.declineReason,
  authorizedAt: iso(tx.authorizedAt),
  clearedAt: isoOrNull(tx.clearedAt),
  invoiceId: tx.invoiceId,
});

export const toInvoiceDto = (
  invoice: Invoice,
  currency: string,
): InvoiceDto => {
  const total = Number(invoice.total);
  const paid = Number(invoice.paid);
  return {
    id: invoice.id,
    accountId: invoice.accountId,
    periodStart: day(invoice.periodStart),
    periodEnd: day(invoice.periodEnd),
    dueDate: day(invoice.dueDate),
    total: money(total, currency),
    paid: money(paid, currency),
    outstanding: money(total - paid, currency),
    reference: invoice.reference,
    status: invoice.status,
  };
};

export const toCompanySummaryDto = (company: Company): CompanySummary => ({
  id: company.id,
  orgNumber: company.orgNumber,
  legalName: company.legalName,
  status: company.status,
});

// Deliberately omits taxNumber.
export const toUserDto = (user: User): UserDto => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
});
