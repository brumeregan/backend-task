import { describe, expect, it } from 'vitest';
import { pageInfo, pageOffset } from '../src/services/pagination';

describe('pagination', () => {
  it('skips the rows of earlier pages', () => {
    expect(pageOffset({ page: 1, limit: 20 })).toBe(0);
    expect(pageOffset({ page: 3, limit: 20 })).toBe(40);
  });

  it('builds the page info from the total', () => {
    expect(pageInfo({ page: 1, limit: 20 }, 54)).toEqual({ number: 1, limit: 20, totalCount: 54, totalPages: 3, hasMore: true });
    expect(pageInfo({ page: 3, limit: 20 }, 54)).toEqual({ number: 3, limit: 20, totalCount: 54, totalPages: 3, hasMore: false });
    expect(pageInfo({ page: 1, limit: 20 }, 0)).toEqual({ number: 1, limit: 20, totalCount: 0, totalPages: 0, hasMore: false });
  });
});
