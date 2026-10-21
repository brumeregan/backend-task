import { CardSchema } from "@qred/b2b-app-schemas";
import type { Card, CardIdParams } from "@qred/b2b-app-schemas";
import type { AsyncRequestHandler } from "../../middleware/asyncHandler";
import { sendValidated } from "../../middleware/sendValidated";
import type { Resources } from "../../resources";
import { activateCard } from "../../services/cardService";

export const createActivateCardHandler =
  ({ database }: Resources): AsyncRequestHandler<CardIdParams, Card, never> =>
  async (req, res) => {
    sendValidated(res, CardSchema, await activateCard(database, req.auth.user.id, req.params.cardId));
  };
