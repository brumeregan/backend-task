import { TransactionSchema } from "@qred/b2b-app-schemas";
import type { Transaction, TransactionIdParams } from "@qred/b2b-app-schemas";
import type { AsyncRequestHandler } from "../../middleware/asyncHandler";
import { sendValidated } from "../../middleware/sendValidated";
import { getTransaction } from "../../services/transactionService";

export const createGetTransactionHandler =
  (): AsyncRequestHandler<TransactionIdParams, Transaction, never> =>
  async (req, res) => {
    sendValidated(
      res,
      TransactionSchema,
      await getTransaction(req.auth.user.id, req.params.transactionId),
    );
  };
