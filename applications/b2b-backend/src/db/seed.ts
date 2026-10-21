import type { TransactionStatus } from '@qred/b2b-app-schemas';
import type { Models } from '../models';

// Fixed IDs keep the hardcoded mock tokens valid.
export const seedIds = {
  users: {
    anna: 'a0000000-0000-4000-8000-000000000001',
    erik: 'a0000000-0000-4000-8000-000000000002',
    sara: 'a0000000-0000-4000-8000-000000000003',
  },
  companies: {
    companyAb: 'b0000000-0000-4000-8000-000000000001',
    nordicTrade: 'b0000000-0000-4000-8000-000000000002',
  },
  accounts: {
    companyAb: 'c0000000-0000-4000-8000-000000000001',
    nordicTrade: 'c0000000-0000-4000-8000-000000000002',
  },
  cards: {
    annaInactive: 'd0000000-0000-4000-8000-000000000001',
    erikActive: 'd0000000-0000-4000-8000-000000000002',
    erikFrozen: 'd0000000-0000-4000-8000-000000000003',
    saraActive: 'd0000000-0000-4000-8000-000000000004',
  },
  invoices: {
    companyAbPaid: 'e0000000-0000-4000-8000-000000000001',
    companyAbOpen: 'e0000000-0000-4000-8000-000000000002',
    nordicTradePaid: 'e0000000-0000-4000-8000-000000000003',
    nordicTradeOpen: 'e0000000-0000-4000-8000-000000000004',
  },
} as const;

type CardKey = 'erikActive' | 'erikFrozen' | 'saraActive';

type Tx = {
  card: CardKey;
  daysAgo: number;
  hour: number;
  merchant: string;
  mcc: string;
  amount: number;
  status?: 'pending' | 'declined' | 'refunded';
  declineReason?: string;
  foreign?: { amount: number; currency: string; country: string };
};

// Deterministic: a fixed list, positioned relative to "now" at seed time.
const TRANSACTIONS: Tx[] = [
  { card: 'erikActive', daysAgo: 0, hour: 8, merchant: 'Espresso House', mcc: '5814', amount: 7900, status: 'pending' },
  { card: 'erikActive', daysAgo: 1, hour: 12, merchant: 'Max Hamburgare', mcc: '5814', amount: 15900 },
  { card: 'erikActive', daysAgo: 2, hour: 17, merchant: 'ICA Maxi', mcc: '5411', amount: 84350 },
  { card: 'erikActive', daysAgo: 3, hour: 9, merchant: 'Circle K', mcc: '5541', amount: 61200, status: 'pending' },
  { card: 'erikActive', daysAgo: 5, hour: 14, merchant: 'Clas Ohlson', mcc: '5251', amount: 34900 },
  { card: 'erikActive', daysAgo: 6, hour: 10, merchant: 'SJ', mcc: '4112', amount: 129900 },
  { card: 'erikActive', daysAgo: 8, hour: 19, merchant: 'Elgiganten', mcc: '5732', amount: 549000, status: 'declined', declineReason: 'insufficient_limit' },
  { card: 'erikActive', daysAgo: 9, hour: 11, merchant: 'Staples', mcc: '5943', amount: 45900 },
  { card: 'erikActive', daysAgo: 11, hour: 13, merchant: 'Booking.com', mcc: '7011', amount: 207000, foreign: { amount: 18000, currency: 'EUR', country: 'NL' } },
  { card: 'erikActive', daysAgo: 14, hour: 16, merchant: 'Telia', mcc: '4814', amount: 59900 },
  { card: 'erikActive', daysAgo: 17, hour: 12, merchant: 'Wayne\'s Coffee', mcc: '5814', amount: 9800 },
  { card: 'erikActive', daysAgo: 20, hour: 15, merchant: 'IKEA', mcc: '5712', amount: 199900, status: 'refunded' },
  { card: 'erikActive', daysAgo: 25, hour: 9, merchant: 'Shell', mcc: '5541', amount: 72500 },
  { card: 'erikActive', daysAgo: 29, hour: 18, merchant: 'Adobe', mcc: '5734', amount: 24900 },
  { card: 'erikActive', daysAgo: 34, hour: 10, merchant: 'Bauhaus', mcc: '5200', amount: 143700 },
  { card: 'erikActive', daysAgo: 38, hour: 13, merchant: 'Pressbyrån', mcc: '5994', amount: 5900 },
  { card: 'erikActive', daysAgo: 43, hour: 12, merchant: 'SL Access', mcc: '4111', amount: 99000 },
  { card: 'erikActive', daysAgo: 48, hour: 14, merchant: 'Webhallen', mcc: '5732', amount: 189900 },
  { card: 'erikActive', daysAgo: 53, hour: 11, merchant: 'Office Depot', mcc: '5111', amount: 62300 },
  { card: 'erikActive', daysAgo: 57, hour: 16, merchant: 'Scandic Hotels', mcc: '7011', amount: 249000 },
  { card: 'erikFrozen', daysAgo: 4, hour: 20, merchant: 'Systembolaget', mcc: '5921', amount: 38900 },
  { card: 'erikFrozen', daysAgo: 22, hour: 12, merchant: 'Apotek Hjärtat', mcc: '5912', amount: 12900 },
  { card: 'erikFrozen', daysAgo: 55, hour: 15, merchant: 'Stadium', mcc: '5651', amount: 79900 },
  { card: 'saraActive', daysAgo: 0, hour: 9, merchant: 'Pressbyrån', mcc: '5994', amount: 6900 },
  { card: 'saraActive', daysAgo: 2, hour: 13, merchant: 'Coop Konsum', mcc: '5411', amount: 45600 },
  { card: 'saraActive', daysAgo: 7, hour: 10, merchant: 'Preem', mcc: '5541', amount: 83400, status: 'pending' },
  { card: 'saraActive', daysAgo: 13, hour: 14, merchant: 'Ryanair', mcc: '4511', amount: 98700, foreign: { amount: 8500, currency: 'EUR', country: 'IE' } },
  { card: 'saraActive', daysAgo: 21, hour: 11, merchant: 'Hemköp', mcc: '5411', amount: 31200 },
  { card: 'saraActive', daysAgo: 33, hour: 17, merchant: 'Jula', mcc: '5200', amount: 112500 },
  { card: 'saraActive', daysAgo: 41, hour: 12, merchant: 'Tele2', mcc: '4814', amount: 44900 },
  { card: 'saraActive', daysAgo: 52, hour: 9, merchant: 'Biltema', mcc: '5531', amount: 56700 },
  { card: 'saraActive', daysAgo: 58, hour: 15, merchant: 'Staples', mcc: '5943', amount: 27300 },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const monthStart = (now: Date, offset: number) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));

const monthEnd = (now: Date, offset: number) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset + 1, 0));

const transactionSeedId = (index: number) =>
  `f0000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;

export const seed = async (models: Models) => {
  const { User, Company, CompanyMembership, Account, Card, SpendLimit, Transaction, Invoice } =
    models;
  // Fixed IDs: a second run would hit duplicate keys, so seeding is a no-op once users exist.
  if ((await User.count()) > 0) {
    return false;
  }

  const now = new Date();
  const { users, companies, accounts, cards, invoices } = seedIds;

  await User.bulkCreate([
    { id: users.anna, firstName: 'Anna', lastName: 'Andersson', email: 'anna@example.com', phone: '+46701234567', taxNumber: '19900101-1234' },
    { id: users.erik, firstName: 'Erik', lastName: 'Eriksson', email: 'erik@example.com', phone: '+46701234568', taxNumber: '19850505-5678' },
    { id: users.sara, firstName: 'Sara', lastName: 'Svensson', email: 'sara@example.com', phone: '+46701234569', taxNumber: '19920202-9012' },
  ]);

  await Company.bulkCreate([
    { id: companies.companyAb, orgNumber: '556677-8899', legalName: 'Company AB', status: 'active' },
    { id: companies.nordicTrade, orgNumber: '559988-7766', legalName: 'Nordic Trade AB', status: 'active' },
  ]);

  await CompanyMembership.bulkCreate([
    { userId: users.anna, companyId: companies.companyAb },
    { userId: users.anna, companyId: companies.nordicTrade },
    { userId: users.erik, companyId: companies.companyAb },
    { userId: users.sara, companyId: companies.nordicTrade },
  ]);

  await Account.bulkCreate([
    { id: accounts.companyAb, companyId: companies.companyAb, creditLimit: 5_000_000, currency: 'SEK', billingDay: 25 },
    { id: accounts.nordicTrade, companyId: companies.nordicTrade, creditLimit: 2_000_000, currency: 'SEK', billingDay: 25 },
  ]);

  const expiryYear = now.getUTCFullYear() + 3;
  await Card.bulkCreate([
    { id: cards.annaInactive, accountId: accounts.companyAb, cardholderUserId: users.anna, issuerCardId: 'iss_anna_0001', last4: '4242', expiryMonth: 9, expiryYear, status: 'inactive' },
    { id: cards.erikActive, accountId: accounts.companyAb, cardholderUserId: users.erik, issuerCardId: 'iss_erik_0001', last4: '1111', expiryMonth: 6, expiryYear, status: 'active', activatedAt: new Date(now.getTime() - 90 * DAY_MS) },
    { id: cards.erikFrozen, accountId: accounts.companyAb, cardholderUserId: users.erik, issuerCardId: 'iss_erik_0002', last4: '1881', expiryMonth: 3, expiryYear, status: 'frozen', activatedAt: new Date(now.getTime() - 120 * DAY_MS) },
    { id: cards.saraActive, accountId: accounts.nordicTrade, cardholderUserId: users.sara, issuerCardId: 'iss_sara_0001', last4: '5555', expiryMonth: 11, expiryYear, status: 'active', activatedAt: new Date(now.getTime() - 60 * DAY_MS) },
  ]);

  // erikActive and erikFrozen have no card limit: they fall back to the credit limit.
  await SpendLimit.bulkCreate(
    [
      { cardId: cards.annaInactive, amount: 1_000_000, period: 'monthly', createdBy: users.anna },
      { accountId: accounts.nordicTrade, amount: 1_500_000, period: 'monthly', createdBy: users.sara },
    ],
    { validate: true },
  );

  // Invoice periods: the month before last is paid, last month is open and due soon.
  const periods = [
    { key: 'Paid', start: monthStart(now, -2), end: monthEnd(now, -2) },
    { key: 'Open', start: monthStart(now, -1), end: monthEnd(now, -1) },
  ] as const;

  const rows = TRANSACTIONS.map((t, index) => {
    const authorizedAt = new Date(now.getTime() - t.daysAgo * DAY_MS);
    
    authorizedAt.setUTCHours(t.hour, 0, 0, 0);
    
    // Never place a seeded authorization in the future (e.g. hour 20 today).
    if (authorizedAt > now) {
      authorizedAt.setTime(now.getTime() - 60_000);
    }

    const status: TransactionStatus = t.status ?? 'cleared';
    const billable = status === 'cleared' || status === 'refunded';
    // Clearing happens about a day later, but never in the future.
    const clearedAt = billable
      ? new Date(Math.min(authorizedAt.getTime() + DAY_MS, now.getTime()))
      : null;
    
      return { t, index, authorizedAt, status, clearedAt };
  });

  const company = (card: CardKey) => (card === 'saraActive' ? 'nordicTrade' : 'companyAb');
  
  const invoiceIdFor = (card: CardKey, authorizedAt: Date, status: string) => {
    if (status !== 'cleared') {
      return null;
    }
    
    const period = periods.find(
      (p) => toDateOnly(authorizedAt) >= toDateOnly(p.start) && toDateOnly(authorizedAt) <= toDateOnly(p.end),
    );
    if (!period){
      return null;
    } 

    const name = `${company(card)}${period.key}` as keyof typeof invoices;
    
    return invoices[name];
  };

  const linked = rows.map((r) => ({ ...r, invoiceId: invoiceIdFor(r.t.card, r.authorizedAt, r.status) }));
  
  const totalFor = (invoiceId: string) =>
    linked.filter((r) => r.invoiceId === invoiceId).reduce((sum, r) => sum + r.t.amount, 0);

  // Dates in the near future relative to seed time, so "Invoice due" always has a live item.
  const dueSoon = toDateOnly(new Date(now.getTime() + 10 * DAY_MS));
  const duePast = toDateOnly(new Date(now.getTime() - 20 * DAY_MS));

  const invoiceRows = [
    { id: invoices.companyAbPaid, accountId: accounts.companyAb, period: periods[0], status: 'paid' as const, dueDate: duePast, reference: '7712345678901' },
    { id: invoices.companyAbOpen, accountId: accounts.companyAb, period: periods[1], status: 'open' as const, dueDate: dueSoon, reference: '7712345678902' },
    { id: invoices.nordicTradePaid, accountId: accounts.nordicTrade, period: periods[0], status: 'paid' as const, dueDate: duePast, reference: '7712345678903' },
    { id: invoices.nordicTradeOpen, accountId: accounts.nordicTrade, period: periods[1], status: 'open' as const, dueDate: dueSoon, reference: '7712345678904' },
  ];
  await Invoice.bulkCreate(
    invoiceRows.map((i) => {
      const total = totalFor(i.id);
      return {
        id: i.id,
        accountId: i.accountId,
        periodStart: toDateOnly(i.period.start),
        periodEnd: toDateOnly(i.period.end),
        total,
        paid: i.status === 'paid' ? total : 0,
        dueDate: i.dueDate,
        reference: i.reference,
        status: i.status,
      };
    }),
  );

  await Transaction.bulkCreate(
    linked.map(({ t, index, authorizedAt, status, clearedAt, invoiceId }) => ({
      id: transactionSeedId(index),
      cardId: cards[t.card],
      status,
      amount: t.amount,
      currency: 'SEK',
      originalAmount: t.foreign?.amount ?? null,
      originalCurrency: t.foreign?.currency ?? null,
      merchantName: t.merchant,
      merchantCategoryCode: t.mcc,
      merchantCountry: t.foreign?.country ?? 'SE',
      declineReason: t.declineReason ?? null,
      authorizedAt,
      clearedAt,
      invoiceId,
    })),
  );

  return true;
};
