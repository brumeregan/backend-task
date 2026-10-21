import { notFound } from '../errors/httpError';
import { isCompanyMember } from '../services/userService';
import type { RequestHandler } from 'express';

// Guards /companies/:companyId/*. Not a member -> 404 (same as a company that does not exist).
export const requireMembership =
  (): RequestHandler<{ companyId: string }> =>
  async (req, _res, next) => {
    try {
      if (!(await isCompanyMember(req.auth.user.id, req.params.companyId))) {
        throw notFound('Company not found');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
