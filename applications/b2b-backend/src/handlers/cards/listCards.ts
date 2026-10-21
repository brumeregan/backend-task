import { CardListResponseSchema } from "@qred/b2b-app-schemas";
import type { CardListResponse, CompanyIdParams } from "@qred/b2b-app-schemas";
import type { AsyncRequestHandler } from "../../middleware/asyncHandler";
import { sendValidated } from "../../middleware/sendValidated";
import { listCards } from "../../services/cardService";

export const createListCardsHandler =
  (): AsyncRequestHandler<CompanyIdParams, CardListResponse, never> =>
  async (req, res) => {
    sendValidated(
      res,
      CardListResponseSchema,
      await listCards(req.auth.user.id, req.params.companyId),
    );
  };
