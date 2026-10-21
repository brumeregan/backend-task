import { UserSchema } from "@qred/b2b-app-schemas";
import type { User } from "@qred/b2b-app-schemas";
import type { AsyncRequestHandler } from "../../middleware/asyncHandler";
import { sendValidated } from "../../middleware/sendValidated";
import { getUser } from "../../services/userService";

export const createGetUserHandler =
  (): AsyncRequestHandler<never, User, never> =>
  async (req, res) => {
    sendValidated(res, UserSchema, await getUser(req.auth.user.id));
  };
