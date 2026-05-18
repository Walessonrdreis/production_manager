export const productionControlSchemas = {
  SnapshotSchema: {
    type: "object",
    properties: {
      id: { type: "string" },
      snapshotId: { type: "string" },
      description: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
    required: ["id", "snapshotId", "createdAt"],
  },

  ProductSchema: {
    type: "object",
    properties: {
      id: { type: "string" },
      snapshotId: { type: "string" },
      description: { type: "string" },
      totalQuantity: { type: "number" },
      pendingQuantity: { type: "number" },
      status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
      scheduledDate: { type: "string", format: "date-time", nullable: true },
      actualDate: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "snapshotId",
      "description",
      "totalQuantity",
      "pendingQuantity",
      "status",
      "createdAt",
      "updatedAt",
    ],
  },

  ProductWithOrdersSchema: {
    type: "object",
    properties: {
      id: { type: "string" },
      snapshotId: { type: "string" },
      description: { type: "string" },
      totalQuantity: { type: "number" },
      pendingQuantity: { type: "number" },
      status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
      scheduledDate: { type: "string", format: "date-time", nullable: true },
      actualDate: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      orders: {
        type: "array",
        items: { $ref: "OrderSchema#" },
      },
    },
    required: [
      "id",
      "snapshotId",
      "description",
      "totalQuantity",
      "pendingQuantity",
      "status",
      "createdAt",
      "updatedAt",
      "orders",
    ],
  },

  OrderSchema: {
    type: "object",
    properties: {
      id: { type: "string" },
      productId: { type: "string" },
      orderNumber: { type: "string", nullable: true },
      clientName: { type: "string", nullable: true },
      quantity: { type: "number" },
      checked: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "productId",
      "quantity",
      "checked",
      "createdAt",
      "updatedAt",
    ],
  },

  HistorySchema: {
    type: "object",
    properties: {
      id: { type: "string" },
      orderId: { type: "string", nullable: true },
      productId: { type: "string", nullable: true },
      action: { type: "string" },
      details: { type: "object", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
    required: ["id", "action", "createdAt"],
  },

  CreateSnapshotResponseSchema: {
    type: "object",
    properties: {
      snapshotId: { type: "string" },
      newProducts: { type: "number" },
      updatedProducts: { type: "number" },
      completedProducts: { type: "number" },
    },
    required: [
      "snapshotId",
      "newProducts",
      "updatedProducts",
      "completedProducts",
    ],
  },

  CleanupResponseSchema: {
    type: "object",
    properties: {
      snapshotsDeleted: { type: "number" },
      historiesDeleted: { type: "number" },
    },
    required: ["snapshotsDeleted", "historiesDeleted"],
  },

  ErrorResponseSchema: {
    type: "object",
    properties: {
      error: {
        type: "object",
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          status: { type: "number" },
          timestamp: { type: "string", format: "date-time" },
        },
        required: ["code", "message", "status", "timestamp"],
      },
    },
    required: ["error"],
  },

  PaginatedResponseSchema: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: {},
      },
      meta: {
        type: "object",
        properties: {
          limit: { type: "number" },
          offset: { type: "number" },
          total: { type: "number" },
        },
        required: ["limit", "offset", "total"],
      },
    },
    required: ["data", "meta"],
  },
} as const;