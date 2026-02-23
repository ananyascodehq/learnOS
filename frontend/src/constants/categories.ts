export interface Category {
    label: string;
    value: string;
    color: string;
}

export const CATEGORIES: Category[] = [
    { label: 'DSA', value: 'DSA', color: '#3B82F6' },
    { label: 'Course / Learning', value: 'Course/Learning', color: '#8B5CF6' },
    { label: 'Projects', value: 'Projects', color: '#10B981' },
    { label: 'College Work', value: 'College Work', color: '#F59E0B' },
    { label: 'Other', value: 'Other', color: '#6B7280' },
];
