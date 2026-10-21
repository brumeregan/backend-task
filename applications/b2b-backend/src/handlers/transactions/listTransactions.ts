import { TransactionListResponseSchema } from "@qred/b2b-app-schemas";
import type { CompanyIdParams, TransactionListQuery, TransactionListResponse } from "@qred/b2b-app-schemas";
import type { AsyncRequestHandler } from "../../middleware/asyncHandler";
import { sendValidated } from "../../middleware/sendValidated";
import { listTransactions } from "../../services/transactionService";

export const createListTransactionsHandler =
  (): AsyncRequestHandler<CompanyIdParams, TransactionListResponse, never, TransactionListQuery> =>
  async (req, res) => {
    sendValidated(
      res,
      TransactionListResponseSchema,
      await listTransactions(req.auth.user.id, req.params.companyId, req.query),
    );
  };
