import { CardSchema } from "@qred/b2b-app-schemas";
import type { Card, CardIdParams } from "@qred/b2b-app-schemas";
import type { AsyncRequestHandler } from "../../middleware/asyncHandler";
import { sendValidated } from "../../middleware/sendValidated";
import { getCard } from "../../services/cardService";

export const createGetCardHandler =
  (): AsyncRequestHandler<CardIdParams, Card, never> =>
  async (req, res) => {
    sendValidated(res, CardSchema, await getCard(req.auth.user.id, req.params.cardId));
  };
