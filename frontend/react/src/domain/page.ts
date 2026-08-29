export interface Page<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export function isLastPage<T>(page: Page<T>): boolean {
  return page.page >= page.totalPages;
}

export function isEmpty<T>(page: Page<T>): boolean {
  return page.total === 0;
}
