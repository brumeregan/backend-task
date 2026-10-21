import { Router } from "express";
import { Resources } from "../resources";
import { createCardHandlers } from "./cards";
import { createCompanyHandlers } from "./companies";
import { createInvoiceHandlers } from "./invoices";
import { createSpendLimitHandlers } from "./spendLimit";
import { createTransactionHandlers } from "./transactions";
import { createUserHandlers } from "./user";

export const createV1Router = (resources: Resources) => {
  const router = Router();

  router.use("/user", createUserHandlers());
  router.use("/companies/:companyId", createCompanyHandlers());
  router.use("/cards/:cardId/spend-limit", createSpendLimitHandlers(resources));
  router.use("/cards", createCardHandlers(resources));
  router.use("/transactions", createTransactionHandlers());
  router.use("/invoices", createInvoiceHandlers());

  return router;
};
