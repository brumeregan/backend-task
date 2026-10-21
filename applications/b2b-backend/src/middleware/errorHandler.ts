import {
  badRequest,
  httpError,
  isHttpError,
  notFound,
} from "../errors/httpError";
import type { HttpError } from "../errors/httpError";
import type { ErrorRequestHandler, RequestHandler } from "express";
import type { ProblemDetails } from "@qred/b2b-app-schemas";
import { Resources } from "../resources";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(notFound(`Route ${req.method} ${req.path} does not exist`));
};

// body-parser errors carry `type`; map them to proper client errors.
const normalize = (error: unknown): HttpError => {
  if (isHttpError(error)) {
    return error;
  }
  
  const type = (error as { type?: string } | null)?.type;

  if (type === "entity.parse.failed") {
    return badRequest("Malformed JSON body");
  }

  if (type === "entity.too.large") {
    return httpError(
      413,
      "payload-too-large",
      "Payload Too Large",
      "Request body is too large",
    );
  }

  return httpError(500, "internal-error", "Internal Server Error");
};

//  Unexpected errors are logged in full but only a generic body is returned (no stack, no internal message).
export const errorHandler =
  ({ logger }: Pick<Resources, "logger">): ErrorRequestHandler =>
  (error, req, res, next) => {
    if (res.headersSent) {
      next(error);

      return;
    }

    const problem = normalize(error);

    if (problem.status >= 500) {
      logger.error({ err: error }, "Unhandled error");
    }

    const body: ProblemDetails = {
      // A short, stable slug clients can switch on (e.g. 'not-found', 'validation-error').
      type: problem.slug,
      title: problem.status >= 500 ? "Internal Server Error" : problem.message,
      status: problem.status,
      ...(problem.detail && problem.status < 500
        ? { detail: problem.detail }
        : {}),
      instance: req.path,
      requestId: res.locals.requestId as string | undefined,
      ...(problem.errors && problem.status < 500 ? { errors: problem.errors } : {}),
    };

    res
      .status(problem.status)
      .type("application/problem+json")
      .send(JSON.stringify(body));
  };
