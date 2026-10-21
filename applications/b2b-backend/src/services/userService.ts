import { toCompanySummaryDto, toUserDto } from './mappers';
import { notFound } from '../errors/httpError';
import { Company, User } from '../models';

const memberOnly = (userId: string) => ({
  association: 'memberships',
  required: true,
  attributes: [],
  where: { userId },
});

export const getUser = async (userId: string) => {
  const user = await User.findByPk(userId);
  // The token is valid (signature checked) but the user is gone: nothing to show.
  if (!user) {
    throw notFound('User not found');
  }
  return toUserDto(user);
};

// Lists are always { data: [...] } (see docs/ARCHITECTURE.md).
export const listUserCompanies = async (userId: string) => {
  const companies = await Company.findAll({
    include: [memberOnly(userId)],
    order: [
      ['legalName', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  return { data: companies.map(toCompanySummaryDto) };
};

// The membership check behind /companies/:companyId/*.
export const isCompanyMember = async (userId: string, companyId: string) =>
  (await Company.count({ where: { id: companyId }, include: [memberOnly(userId)] })) > 0;
