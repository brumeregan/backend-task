import { InvoiceSchema } from "@qred/b2b-app-schemas";
import type { Invoice, InvoiceIdParams } from "@qred/b2b-app-schemas";
import type { AsyncRequestHandler } from "../../middleware/asyncHandler";
import { sendValidated } from "../../middleware/sendValidated";
import { getInvoice } from "../../services/invoiceService";

export const createGetInvoiceHandler =
  (): AsyncRequestHandler<InvoiceIdParams, Invoice, never> =>
  async (req, res) => {
    sendValidated(res, InvoiceSchema, await getInvoice(req.auth.user.id, req.params.invoiceId));
  };
