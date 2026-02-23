import type { CategoryType, SessionStatus } from './index';

export interface SessionFilters {
    categories?: CategoryType[];
    status?: SessionStatus | 'all';
    wasUseful?: boolean | null;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}
