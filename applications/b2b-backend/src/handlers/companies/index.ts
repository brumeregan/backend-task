import { Router } from "express";
import {
  CompanyIdParamsSchema,
  InvoiceListQuerySchema,
  TransactionListQuerySchema,
} from "@qred/b2b-app-schemas";
import { withAsyncHandler } from "../../middleware/asyncHandler";
import { requireMembership } from "../../middleware/requireMembership";
import { validate } from "../../middleware/validate";
import { createListCardsHandler } from "../cards/listCards";
import { createListInvoicesHandler } from "../invoices/listInvoices";
import { createListTransactionsHandler } from "../transactions/listTransactions";

// Company-scoped lists. Mounted at /companies/:companyId; membership is checked once for all.
export const createCompanyHandlers = () => {
  const router = Router({ mergeParams: true });

  router.use(validate({ params: CompanyIdParamsSchema }), requireMembership());

  router.get("/cards", withAsyncHandler(createListCardsHandler()));

  router.get(
    "/transactions",
    validate({ query: TransactionListQuerySchema }),
    withAsyncHandler(createListTransactionsHandler()),
  );

  router.get(
    "/invoices",
    validate({ query: InvoiceListQuerySchema }),
    withAsyncHandler(createListInvoicesHandler()),
  );

  return router;
};
