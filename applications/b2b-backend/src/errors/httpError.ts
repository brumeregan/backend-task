export type ValidationIssue = { path: string; message: string };

export type HttpError = Error & {
  status: number;
  slug: string;
  detail?: string;
  errors?: ValidationIssue[];
};

// A plain factory instead of an Error subclass: the repo bans `function`/constructors.
export const httpError = (
  status: number,
  slug: string,
  title: string,
  detail?: string,
  errors?: ValidationIssue[],
): HttpError => {
  return Object.assign(new Error(title), { status, slug, detail, errors });
};

export const isHttpError = (value: unknown): value is HttpError => {
  return value instanceof Error && "status" in value && "slug" in value;
};

export const badRequest = (detail: string, errors?: ValidationIssue[]) => {
  return httpError(400, "validation-error", "Bad Request", detail, errors);
};

export const unauthorized = (detail: string) => {
  return httpError(401, "unauthorized", "Unauthorized", detail);
};

// Also used for resources the caller may not access: never 403, never leak existence.
export const notFound = (detail: string) => {
  return httpError(404, "not-found", "Not Found", detail);
};

export const conflict = (detail: string) => {
  return httpError(409, "conflict", "Conflict", detail);
};

export const unprocessable = (detail: string) => {
  return httpError(422, "unprocessable", "Unprocessable Content", detail);
};

export const tooManyRequests = () => {
  return httpError(
    429,
    "rate-limited",
    "Too Many Requests",
    "Rate limit exceeded, retry later",
  );
};
