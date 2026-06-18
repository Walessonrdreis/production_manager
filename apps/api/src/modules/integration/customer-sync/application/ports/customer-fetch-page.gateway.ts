import type { CustomerExternalCustomer } from "./customer-fetch.gateway";

export type CustomerFetchPageResult = {
    items: CustomerExternalCustomer[];
    totalPages: number;
    currentPage: number;
    totalRecords: number;
    hasNext: boolean;
};

export interface CustomerFetchPageGateway {
    fetchPage(page: number, pageSize: number): Promise<CustomerFetchPageResult>;
}
