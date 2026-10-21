import { Router } from "express";
import { withAsyncHandler } from "../../middleware/asyncHandler";
import { createGetUserHandler } from "./getUser";
import { createGetUserCompaniesHandler } from "./getUserCompanies";

export const createUserHandlers = () => {
  const router = Router({ mergeParams: true });

  router.get("/", withAsyncHandler(createGetUserHandler()));

  router.get("/companies", withAsyncHandler(createGetUserCompaniesHandler()));

  return router;
};
