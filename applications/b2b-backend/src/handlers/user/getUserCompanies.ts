import { UserCompaniesResponseSchema } from "@qred/b2b-app-schemas";
import type { UserCompaniesResponse } from "@qred/b2b-app-schemas";
import type { AsyncRequestHandler } from "../../middleware/asyncHandler";
import { sendValidated } from "../../middleware/sendValidated";
import { listUserCompanies } from "../../services/userService";

export const createGetUserCompaniesHandler =
  (): AsyncRequestHandler<never, UserCompaniesResponse, never> =>
  async (req, res) => {
    sendValidated(res, UserCompaniesResponseSchema, await listUserCompanies(req.auth.user.id));
  };
