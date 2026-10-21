import { SpendLimitSchema } from "@qred/b2b-app-schemas";
import type { CardIdParams, SpendLimit } from "@qred/b2b-app-schemas";
import type { AsyncRequestHandler } from "../../middleware/asyncHandler";
import { sendValidated } from "../../middleware/sendValidated";
import { getSpendLimit } from "../../services/spendLimitService";

export const createGetSpendLimitHandler =
  (): AsyncRequestHandler<CardIdParams, SpendLimit, never> =>
  async (req, res) => {
    sendValidated(res, SpendLimitSchema, await getSpendLimit(req.auth.user.id, req.params.cardId));
  };
