export type GetCustomerStatsResponseDTO = {
    total: number;
    active: number;
    inactive: number;
    lastSyncAt: Date | null;
    lastCustomerCode: string | null;
};
