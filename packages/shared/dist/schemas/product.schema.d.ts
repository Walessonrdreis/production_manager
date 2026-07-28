import { z } from 'zod';
export declare const OmieProductSchema: z.ZodObject<{
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
}>;
export declare const ProductSectorSchema: z.ZodObject<{
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
}>;
export declare const ProductSchema: z.ZodObject<{
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
}>;
export type OmieProduct = z.infer<typeof OmieProductSchema>;
export type ProductSector = z.infer<typeof ProductSectorSchema>;
export type Product = z.infer<typeof ProductSchema>;
export declare const CreateProductInputSchema: z.ZodObject<{
    omieProductId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    omieProductId: string;
}, {
    omieProductId: string;
}>;
export declare const UpdateProductSectorInputSchema: z.ZodObject<{
    sectorId: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sectorId: string;
    notes?: string | undefined;
}, {
    sectorId: string;
    notes?: string | undefined;
}>;
