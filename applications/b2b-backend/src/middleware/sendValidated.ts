import type { z } from "zod";
import type { Response } from "express";

// Every response is checked against its contract schema before it leaves the API.
// A mismatch is a server bug (contract drift), not a client error: it throws a plain Error,
// which the error handler logs in full and answers with a generic 500. The message holds
// schema paths only, never values, so no personal data reaches the logs.
export const sendValidated = <S extends z.ZodTypeAny>(
  res: Response,
  schema: S,
  payload: z.input<S>,
  status = 200,
) => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const paths = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Response does not match its contract schema: ${paths}`);
  }
  res.status(status).json(result.data);
};
