import { Router } from "express";
import { CardIdParamsSchema } from "@qred/b2b-app-schemas";
import { withAsyncHandler } from "../../middleware/asyncHandler";
import { validate } from "../../middleware/validate";
import { Resources } from "../../resources";
import { createActivateCardHandler } from "./activateCard";
import { createFreezeCardHandler } from "./freezeCard";
import { createGetCardHandler } from "./getCard";
import { createUnfreezeCardHandler } from "./unfreezeCard";

export const createCardHandlers = (resources: Resources) => {
  const router = Router({ mergeParams: true });

  router.get(
    "/:cardId",
    validate({ params: CardIdParamsSchema }),
    withAsyncHandler(createGetCardHandler()),
  );

  router.post(
    "/:cardId/activate",
    validate({ params: CardIdParamsSchema }),
    withAsyncHandler(createActivateCardHandler(resources)),
  );

  router.post(
    "/:cardId/freeze",
    validate({ params: CardIdParamsSchema }),
    withAsyncHandler(createFreezeCardHandler(resources)),
  );

  router.post(
    "/:cardId/unfreeze",
    validate({ params: CardIdParamsSchema }),
    withAsyncHandler(createUnfreezeCardHandler(resources)),
  );

  return router;
};
