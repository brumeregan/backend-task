import { Router } from "express";
import { CardIdParamsSchema, PutSpendLimitBodySchema } from "@qred/b2b-app-schemas";
import { withAsyncHandler } from "../../middleware/asyncHandler";
import { validate } from "../../middleware/validate";
import { Resources } from "../../resources";
import { createGetSpendLimitHandler } from "./getSpendLimit";
import { createPutSpendLimitHandler } from "./putSpendLimit";

export const createSpendLimitHandlers = (resources: Resources) => {
  const router = Router({ mergeParams: true });

  router.get(
    "/",
    validate({ params: CardIdParamsSchema }),
    withAsyncHandler(createGetSpendLimitHandler()),
  );

  router.put(
    "/",
    validate({ params: CardIdParamsSchema, body: PutSpendLimitBodySchema }),
    withAsyncHandler(createPutSpendLimitHandler(resources)),
  );

  return router;
};
