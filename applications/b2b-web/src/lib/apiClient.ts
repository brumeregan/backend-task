import { ProblemDetailsSchema } from '@qred/b2b-app-schemas';
import type { z } from 'zod';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status = 0;
  title = '';
  detail: string | undefined = undefined;
}

export const createApiError = (status: number, title: string, detail?: string): ApiError =>
  Object.assign(new ApiError(detail ?? title), { status, title, detail });

const request = async <S extends z.ZodTypeAny>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  schema: S,
  token: string,
  body?: unknown,
): Promise<z.infer<S>> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const problem = ProblemDetailsSchema.safeParse(payload);
    throw problem.success
      ? createApiError(response.status, problem.data.title, problem.data.detail)
      : createApiError(response.status, response.statusText || 'Request failed');
  }
  // Fails loudly on contract drift.
  return schema.parse(payload);
};

export const apiGet = <S extends z.ZodTypeAny>(path: string, schema: S, token: string) =>
  request('GET', path, schema, token);

export const apiPost = <S extends z.ZodTypeAny>(path: string, schema: S, token: string, body?: unknown) =>
  request('POST', path, schema, token, body);

export const apiPut = <S extends z.ZodTypeAny>(path: string, schema: S, token: string, body: unknown) =>
  request('PUT', path, schema, token, body);

export const errorMessage = (error: unknown): string =>
  error instanceof ApiError ? (error.detail ?? error.title) : error instanceof Error ? error.message : 'Unknown error';
