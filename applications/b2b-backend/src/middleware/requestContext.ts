import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

const VALID_REQUEST_ID = /^[A-Za-z0-9._-]{8,64}$/;

// Assigns each request an id: reuses the client's x-request-id header if it matches VALID_REQUEST_ID,
// otherwise generates a UUID. The id is returned in the x-request-id response header and stored in
// res.locals for the access log, error logs and problem responses, so one request can be traced end to end.
export const requestContext: RequestHandler = (req, res, next) => {
  const incoming = req.header('x-request-id');
  const requestId = incoming && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
