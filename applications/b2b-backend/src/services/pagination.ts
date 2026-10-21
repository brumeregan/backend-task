import type { PageInfo, PageQuery } from '@qred/b2b-app-schemas';

export const pageOffset = ({ page, limit }: PageQuery) => (page - 1) * limit;

export const pageInfo = ({ page, limit }: PageQuery, totalCount: number): PageInfo => ({
  number: page,
  limit,
  totalCount,
  totalPages: Math.ceil(totalCount / limit),
  hasMore: page * limit < totalCount,
});
