import { z } from "zod";
import { badRequest } from "../errors/httpError";
import type { RequestHandler } from "express";

type Schemas = {
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  body?: z.ZodTypeAny;
};

const issuesOf = (where: string, error: z.ZodError) =>
  error.issues.map((issue) => ({
    path: [where, ...issue.path].join("."),
    message: issue.message,
  }));

// Validates params/query/body with the shared contract schemas and replaces them with the
// parsed (coerced, defaulted) values, so handlers can trust their types.
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    const issues: { path: string; message: string }[] = [];
    const parts = ["params", "query", "body"] as const;

    for (const part of parts) {
      const schema = schemas[part];

      if (!schema) {
        continue;
      }
      const result = schema.safeParse(req[part]);
      
      if (result.success) {
        req[part] = result.data;
      } else {
        issues.push(...issuesOf(part, result.error));
      }
    }
    next(
      issues.length > 0
        ? badRequest("Request validation failed", issues)
        : undefined,
    );
  };
