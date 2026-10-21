import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ParamsDictionary, Query } from "express-serve-static-core";

export type AsyncRequestHandler<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Query,
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction,
) => Promise<unknown>;

// Express 4 does not catch rejected promises; forward them to the error handler.
// P/B/Q describe what the validate() middleware already guaranteed about params/body/query.
// The returned handler is untyped on purpose: Express' router cannot express "validated" types.
export const withAsyncHandler =
  <P, ResBody, ReqBody, ReqQuery>(
    handler: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>,
  ): RequestHandler =>
  (req, res, next) => {
    handler(req as never, res as never, next).catch(next);
  };
