import { z } from 'zod';
export declare const PlanStatusEnum: z.ZodEnum<["DRAFT", "PUBLISHED", "CLOSED"]>;
export declare const ProductionPlanItemSchema: z.ZodObject<{
    id: z.ZodString;
    planId: z.ZodString;
    productId: z.ZodString;
    sectorId: z.ZodString;
    quantity: z.ZodNumber;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sector: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        order: z.ZodNumber;
        active: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        order: number;
        active: boolean;
    }, {
        id: string;
        name: string;
        order: number;
        active: boolean;
    }>>;
    product: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        omieProductId: z.ZodString;
        nickname: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        active: z.ZodBoolean;
        omieProduct: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            omieId: z.ZodString;
            code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            familyDescription: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            sku: z.ZodNullable<z.ZodString>;
            description: z.ZodString;
            active: z.ZodBoolean;
            stockQuantity: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            minimumStock: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            rawPayload: z.ZodOptional<z.ZodAny>;
            lastSyncAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            active: boolean;
            omieId: string;
            sku: string | null;
            description: string;
            lastSyncAt: string | Date;
            code?: string | null | undefined;
            familyDescription?: string | null | undefined;
            stockQuantity?: string | null | undefined;
            minimumStock?: string | null | undefined;
            rawPayload?: any;
        }, {
            id: string;
            active: boolean;
            omieId: string;
            sku: string | null;
            description: string;
            lastSyncAt: string | Date;
            code?: string | null | undefined;
            familyDescription?: string | null | undefined;
            stockQuantity?: string | null | undefined;
            minimumStock?: string | null | undefined;
            rawPayload?: any;
        }>>;
        productSector: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            productId: z.ZodString;
            sectorId: z.ZodString;
            notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            sector: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                order: z.ZodNumber;
                active: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
                order: number;
                active: boolean;
            }, {
                id: string;
                name: string;
                order: number;
                active: boolean;
            }>>;
        }, "strip", z.ZodTypeAny, {
            productId: string;
            sectorId: string;
            notes?: string | null | undefined;
            sector?: {
                id: string;
                name: string;
                order: number;
                active: boolean;
            } | undefined;
        }, {
            productId: string;
            sectorId: string;
            notes?: string | null | undefined;
            sector?: {
                id: string;
                name: string;
                order: number;
                active: boolean;
            } | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        active: boolean;
        omieProductId: string;
        nickname?: string | null | undefined;
        omieProduct?: {
            id: string;
            active: boolean;
            omieId: string;
            sku: string | null;
            description: string;
            lastSyncAt: string | Date;
            code?: string | null | undefined;
            familyDescription?: string | null | undefined;
            stockQuantity?: string | null | undefined;
            minimumStock?: string | null | undefined;
            rawPayload?: any;
        } | undefined;
        productSector?: {
            productId: string;
            sectorId: string;
            notes?: string | null | undefined;
            sector?: {
                id: string;
                name: string;
                order: number;
                active: boolean;
            } | undefined;
        } | null | undefined;
    }, {
        id: string;
        active: boolean;
        omieProductId: string;
        nickname?: string | null | undefined;
        omieProduct?: {
            id: string;
            active: boolean;
            omieId: string;
            sku: string | null;
            description: string;
            lastSyncAt: string | Date;
            code?: string | null | undefined;
            familyDescription?: string | null | undefined;
            stockQuantity?: string | null | undefined;
            minimumStock?: string | null | undefined;
            rawPayload?: any;
        } | undefined;
        productSector?: {
            productId: string;
            sectorId: string;
            notes?: string | null | undefined;
            sector?: {
                id: string;
                name: string;
                order: number;
                active: boolean;
            } | undefined;
        } | null | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    productId: string;
    sectorId: string;
    planId: string;
    quantity: number;
    notes?: string | null | undefined;
    sector?: {
        id: string;
        name: string;
        order: number;
        active: boolean;
    } | undefined;
    product?: {
        id: string;
        active: boolean;
        omieProductId: string;
        nickname?: string | null | undefined;
        omieProduct?: {
            id: string;
            active: boolean;
            omieId: string;
            sku: string | null;
            description: string;
            lastSyncAt: string | Date;
            code?: string | null | undefined;
            familyDescription?: string | null | undefined;
            stockQuantity?: string | null | undefined;
            minimumStock?: string | null | undefined;
            rawPayload?: any;
        } | undefined;
        productSector?: {
            productId: string;
            sectorId: string;
            notes?: string | null | undefined;
            sector?: {
                id: string;
                name: string;
                order: number;
                active: boolean;
            } | undefined;
        } | null | undefined;
    } | undefined;
}, {
    id: string;
    productId: string;
    sectorId: string;
    planId: string;
    quantity: number;
    notes?: string | null | undefined;
    sector?: {
        id: string;
        name: string;
        order: number;
        active: boolean;
    } | undefined;
    product?: {
        id: string;
        active: boolean;
        omieProductId: string;
        nickname?: string | null | undefined;
        omieProduct?: {
            id: string;
            active: boolean;
            omieId: string;
            sku: string | null;
            description: string;
            lastSyncAt: string | Date;
            code?: string | null | undefined;
            familyDescription?: string | null | undefined;
            stockQuantity?: string | null | undefined;
            minimumStock?: string | null | undefined;
            rawPayload?: any;
        } | undefined;
        productSector?: {
            productId: string;
            sectorId: string;
            notes?: string | null | undefined;
            sector?: {
                id: string;
                name: string;
                order: number;
                active: boolean;
            } | undefined;
        } | null | undefined;
    } | undefined;
}>;
export declare const ProductionPlanSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    startDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    endDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    status: z.ZodEnum<["DRAFT", "PUBLISHED", "CLOSED"]>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        planId: z.ZodString;
        productId: z.ZodString;
        sectorId: z.ZodString;
        quantity: z.ZodNumber;
        notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        sector: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            order: z.ZodNumber;
            active: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            order: number;
            active: boolean;
        }, {
            id: string;
            name: string;
            order: number;
            active: boolean;
        }>>;
        product: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            omieProductId: z.ZodString;
            nickname: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            active: z.ZodBoolean;
            omieProduct: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                omieId: z.ZodString;
                code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                familyDescription: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                sku: z.ZodNullable<z.ZodString>;
                description: z.ZodString;
                active: z.ZodBoolean;
                stockQuantity: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                minimumStock: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                rawPayload: z.ZodOptional<z.ZodAny>;
                lastSyncAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                active: boolean;
                omieId: string;
                sku: string | null;
                description: string;
                lastSyncAt: string | Date;
                code?: string | null | undefined;
                familyDescription?: string | null | undefined;
                stockQuantity?: string | null | undefined;
                minimumStock?: string | null | undefined;
                rawPayload?: any;
            }, {
                id: string;
                active: boolean;
                omieId: string;
                sku: string | null;
                description: string;
                lastSyncAt: string | Date;
                code?: string | null | undefined;
                familyDescription?: string | null | undefined;
                stockQuantity?: string | null | undefined;
                minimumStock?: string | null | undefined;
                rawPayload?: any;
            }>>;
            productSector: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                productId: z.ZodString;
                sectorId: z.ZodString;
                notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                sector: z.ZodOptional<z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                    order: z.ZodNumber;
                    active: z.ZodBoolean;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                    order: number;
                    active: boolean;
                }, {
                    id: string;
                    name: string;
                    order: number;
                    active: boolean;
                }>>;
            }, "strip", z.ZodTypeAny, {
                productId: string;
                sectorId: string;
                notes?: string | null | undefined;
                sector?: {
                    id: string;
                    name: string;
                    order: number;
                    active: boolean;
                } | undefined;
            }, {
                productId: string;
                sectorId: string;
                notes?: string | null | undefined;
                sector?: {
                    id: string;
                    name: string;
                    order: number;
                    active: boolean;
                } | undefined;
            }>>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            active: boolean;
            omieProductId: string;
            nickname?: string | null | undefined;
            omieProduct?: {
                id: string;
                active: boolean;
                omieId: string;
                sku: string | null;
                description: string;
                lastSyncAt: string | Date;
                code?: string | null | undefined;
                familyDescription?: string | null | undefined;
                stockQuantity?: string | null | undefined;
                minimumStock?: string | null | undefined;
                rawPayload?: any;
            } | undefined;
            productSector?: {
                productId: string;
                sectorId: string;
                notes?: string | null | undefined;
                sector?: {
                    id: string;
                    name: string;
                    order: number;
                    active: boolean;
                } | undefined;
            } | null | undefined;
        }, {
            id: string;
            active: boolean;
            omieProductId: string;
            nickname?: string | null | undefined;
            omieProduct?: {
                id: string;
                active: boolean;
                omieId: string;
                sku: string | null;
                description: string;
                lastSyncAt: string | Date;
                code?: string | null | undefined;
                familyDescription?: string | null | undefined;
                stockQuantity?: string | null | undefined;
                minimumStock?: string | null | undefined;
                rawPayload?: any;
            } | undefined;
            productSector?: {
                productId: string;
                sectorId: string;
                notes?: string | null | undefined;
                sector?: {
                    id: string;
                    name: string;
                    order: number;
                    active: boolean;
                } | undefined;
            } | null | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        productId: string;
        sectorId: string;
        planId: string;
        quantity: number;
        notes?: string | null | undefined;
        sector?: {
            id: string;
            name: string;
            order: number;
            active: boolean;
        } | undefined;
        product?: {
            id: string;
            active: boolean;
            omieProductId: string;
            nickname?: string | null | undefined;
            omieProduct?: {
                id: string;
                active: boolean;
                omieId: string;
                sku: string | null;
                description: string;
                lastSyncAt: string | Date;
                code?: string | null | undefined;
                familyDescription?: string | null | undefined;
                stockQuantity?: string | null | undefined;
                minimumStock?: string | null | undefined;
                rawPayload?: any;
            } | undefined;
            productSector?: {
                productId: string;
                sectorId: string;
                notes?: string | null | undefined;
                sector?: {
                    id: string;
                    name: string;
                    order: number;
                    active: boolean;
                } | undefined;
            } | null | undefined;
        } | undefined;
    }, {
        id: string;
        productId: string;
        sectorId: string;
        planId: string;
        quantity: number;
        notes?: string | null | undefined;
        sector?: {
            id: string;
            name: string;
            order: number;
            active: boolean;
        } | undefined;
        product?: {
            id: string;
            active: boolean;
            omieProductId: string;
            nickname?: string | null | undefined;
            omieProduct?: {
                id: string;
                active: boolean;
                omieId: string;
                sku: string | null;
                description: string;
                lastSyncAt: string | Date;
                code?: string | null | undefined;
                familyDescription?: string | null | undefined;
                stockQuantity?: string | null | undefined;
                minimumStock?: string | null | undefined;
                rawPayload?: any;
            } | undefined;
            productSector?: {
                productId: string;
                sectorId: string;
                notes?: string | null | undefined;
                sector?: {
                    id: string;
                    name: string;
                    order: number;
                    active: boolean;
                } | undefined;
            } | null | undefined;
        } | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    status: "DRAFT" | "PUBLISHED" | "CLOSED";
    startDate: string | Date;
    endDate: string | Date;
    createdAt: string | Date;
    items?: {
        id: string;
        productId: string;
        sectorId: string;
        planId: string;
        quantity: number;
        notes?: string | null | undefined;
        sector?: {
            id: string;
            name: string;
            order: number;
            active: boolean;
        } | undefined;
        product?: {
            id: string;
            active: boolean;
            omieProductId: string;
            nickname?: string | null | undefined;
            omieProduct?: {
                id: string;
                active: boolean;
                omieId: string;
                sku: string | null;
                description: string;
                lastSyncAt: string | Date;
                code?: string | null | undefined;
                familyDescription?: string | null | undefined;
                stockQuantity?: string | null | undefined;
                minimumStock?: string | null | undefined;
                rawPayload?: any;
            } | undefined;
            productSector?: {
                productId: string;
                sectorId: string;
                notes?: string | null | undefined;
                sector?: {
                    id: string;
                    name: string;
                    order: number;
                    active: boolean;
                } | undefined;
            } | null | undefined;
        } | undefined;
    }[] | undefined;
}, {
    id: string;
    name: string;
    status: "DRAFT" | "PUBLISHED" | "CLOSED";
    startDate: string | Date;
    endDate: string | Date;
    createdAt: string | Date;
    items?: {
        id: string;
        productId: string;
        sectorId: string;
        planId: string;
        quantity: number;
        notes?: string | null | undefined;
        sector?: {
            id: string;
            name: string;
            order: number;
            active: boolean;
        } | undefined;
        product?: {
            id: string;
            active: boolean;
            omieProductId: string;
            nickname?: string | null | undefined;
            omieProduct?: {
                id: string;
                active: boolean;
                omieId: string;
                sku: string | null;
                description: string;
                lastSyncAt: string | Date;
                code?: string | null | undefined;
                familyDescription?: string | null | undefined;
                stockQuantity?: string | null | undefined;
                minimumStock?: string | null | undefined;
                rawPayload?: any;
            } | undefined;
            productSector?: {
                productId: string;
                sectorId: string;
                notes?: string | null | undefined;
                sector?: {
                    id: string;
                    name: string;
                    order: number;
                    active: boolean;
                } | undefined;
            } | null | undefined;
        } | undefined;
    }[] | undefined;
}>;
export type PlanStatus = z.infer<typeof PlanStatusEnum>;
export type ProductionPlanItem = z.infer<typeof ProductionPlanItemSchema>;
export type ProductionPlan = z.infer<typeof ProductionPlanSchema>;
export declare const CreatePlanInputSchema: z.ZodObject<{
    name: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    startDate: string;
    endDate: string;
}, {
    name: string;
    startDate: string;
    endDate: string;
}>;
export declare const AddPlanItemInputSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodNumber;
    sectorId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    sectorId?: string | undefined;
    notes?: string | undefined;
}, {
    productId: string;
    quantity: number;
    sectorId?: string | undefined;
    notes?: string | undefined;
}>;
