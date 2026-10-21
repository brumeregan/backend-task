import type { Sequelize } from "sequelize";
import { initAccount, Account } from "./account";
import { initAuditLog, AuditLog } from "./audit-log";
import { initCard, Card } from "./card";
import { initCompany, Company } from "./company";
import { initCompanyMembership, CompanyMembership } from "./company-membership";
import { initInvoice, Invoice } from "./invoice";
import { initSpendLimit, SpendLimit } from "./spend-limit";
import { initTransaction, Transaction } from "./transaction";
import { initUser, User } from "./user";

export {
  Account,
  AuditLog,
  Card,
  Company,
  CompanyMembership,
  Invoice,
  SpendLimit,
  Transaction,
  User,
};

// Binds all models to the given Sequelize instance and wires the associations.
export const initModels = (sequelize: Sequelize) => {
  initUser(sequelize);
  initCompany(sequelize);
  initCompanyMembership(sequelize);
  initAccount(sequelize);
  initCard(sequelize);
  initSpendLimit(sequelize);
  initTransaction(sequelize);
  initInvoice(sequelize);
  initAuditLog(sequelize);

  Company.hasMany(CompanyMembership, {
    as: "memberships",
    foreignKey: "companyId",
  });

  CompanyMembership.belongsTo(User, { as: "user", foreignKey: "userId" });
  CompanyMembership.belongsTo(Company, {
    as: "company",
    foreignKey: "companyId",
  });

  User.belongsToMany(Company, {
    through: CompanyMembership,
    as: "companies",
    foreignKey: "userId",
    otherKey: "companyId",
  });

  Company.hasMany(Account, { as: "accounts", foreignKey: "companyId" });
  Account.belongsTo(Company, { as: "company", foreignKey: "companyId" });

  Account.hasMany(Card, { as: "cards", foreignKey: "accountId" });
  Card.belongsTo(Account, { as: "account", foreignKey: "accountId" });
  Card.belongsTo(User, { as: "cardholder", foreignKey: "cardholderUserId" });

  Card.hasMany(Transaction, { as: "transactions", foreignKey: "cardId" });
  Transaction.belongsTo(Card, { as: "card", foreignKey: "cardId" });

  Card.hasMany(SpendLimit, { as: "spendLimits", foreignKey: "cardId" });
  Account.hasMany(SpendLimit, { as: "spendLimits", foreignKey: "accountId" });

  Account.hasMany(Invoice, { as: "invoices", foreignKey: "accountId" });
  Invoice.belongsTo(Account, { as: "account", foreignKey: "accountId" });
  Invoice.hasMany(Transaction, { as: "transactions", foreignKey: "invoiceId" });
  Transaction.belongsTo(Invoice, { as: "invoice", foreignKey: "invoiceId" });

  AuditLog.belongsTo(User, { as: "actor", foreignKey: "actorId" });
  AuditLog.belongsTo(Company, { as: "company", foreignKey: "companyId" });

  return {
    User,
    Company,
    CompanyMembership,
    Account,
    Card,
    SpendLimit,
    Transaction,
    Invoice,
    AuditLog,
  };
};

export type Models = ReturnType<typeof initModels>;
