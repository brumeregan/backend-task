declare global {
  namespace Express {
    interface Request {
      // Claims of the verified access token; only present on authenticated (/v1) routes.
      auth: { user: { id: string } };
    }
  }
}

export {};
