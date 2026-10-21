import { InvoiceListResponseSchema } from "@qred/b2b-app-schemas";
import type { CompanyIdParams, InvoiceListQuery, InvoiceListResponse } from "@qred/b2b-app-schemas";
import type { AsyncRequestHandler } from "../../middleware/asyncHandler";
import { sendValidated } from "../../middleware/sendValidated";
import { listInvoices } from "../../services/invoiceService";

export const createListInvoicesHandler =
  (): AsyncRequestHandler<CompanyIdParams, InvoiceListResponse, never, InvoiceListQuery> =>
  async (req, res) => {
    sendValidated(
      res,
      InvoiceListResponseSchema,
      await listInvoices(req.auth.user.id, req.params.companyId, req.query),
    );
  };
