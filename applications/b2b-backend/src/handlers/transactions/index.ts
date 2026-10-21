import { TransactionIdParamsSchema } from "@qred/b2b-app-schemas";
import { Router } from "express";
import { withAsyncHandler } from "../../middleware/asyncHandler";
import { validate } from "../../middleware/validate";
import { createGetTransactionHandler } from "./getTransaction";

export const createTransactionHandlers = () => {
  const router = Router({ mergeParams: true });

  router.get(
    "/:transactionId",
    validate({ params: TransactionIdParamsSchema }),
    withAsyncHandler(createGetTransactionHandler()),
  );

  return router;
};
