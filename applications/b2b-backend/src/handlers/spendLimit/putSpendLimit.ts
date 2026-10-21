import { SpendLimitSchema } from "@qred/b2b-app-schemas";
import type { CardIdParams, PutSpendLimitBody, SpendLimit } from "@qred/b2b-app-schemas";
import type { AsyncRequestHandler } from "../../middleware/asyncHandler";
import { sendValidated } from "../../middleware/sendValidated";
import type { Resources } from "../../resources";
import { putSpendLimit } from "../../services/spendLimitService";

export const createPutSpendLimitHandler =
  ({ database }: Resources): AsyncRequestHandler<CardIdParams, SpendLimit, PutSpendLimitBody> =>
  async (req, res) => {
    sendValidated(
      res,
      SpendLimitSchema,
      await putSpendLimit(database, req.auth.user.id, req.params.cardId, req.body),
    );
  };
