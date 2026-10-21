import { Router } from "express";
import { InvoiceIdParamsSchema } from "@qred/b2b-app-schemas";
import { withAsyncHandler } from "../../middleware/asyncHandler";
import { validate } from "../../middleware/validate";
import { createGetInvoiceHandler } from "./getInvoice";

export const createInvoiceHandlers = () => {
  const router = Router({ mergeParams: true });

  router.get(
    "/:invoiceId",
    validate({ params: InvoiceIdParamsSchema }),
    withAsyncHandler(createGetInvoiceHandler()),
  );

  return router;
};
