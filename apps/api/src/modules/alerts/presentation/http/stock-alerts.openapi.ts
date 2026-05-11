/**
 * OpenAPI Documentation for Stock Alerts Module
 * 
 * This module provides endpoints for managing stock alerts and configurations.
 * Part of API Core - Fase 2 implementation.
 */

export const stockAlertsOpenAPIDocs = {
  openapi: "3.0.0",
  info: {
    title: "Stock Alerts API",
    description: "API for managing stock alerts and configurations",
    version: "1.0.0",
    contact: {
      name: "Production Manager API",
      email: "support@production-manager.com"
    }
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server"
    },
    {
      url: "https://api.production-manager.com",
      description: "Production server"
    }
  ],
  tags: [
    {
      name: "alerts",
      description: "Stock alerts management"
    }
  ],
  paths: {
    "/api/alerts/stock": {
      get: {
        tags: ["alerts"],
        summary: "List stock alerts with filters",
        description: "Retrieve stock alerts with optional filtering by severity, status, product code, and date range",
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number for pagination",
            schema: {
              type: "integer",
              minimum: 1,
              default: 1
            }
          },
          {
            name: "pageSize",
            in: "query",
            description: "Number of items per page",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20
            }
          },
          {
            name: "severity",
            in: "query",
            description: "Filter by alert severity",
            schema: {
              type: "string",
              enum: ["critical", "warning", "info"]
            }
          },
          {
            name: "resolved",
            in: "query",
            description: "Filter by resolution status",
            schema: {
              type: "boolean"
            }
          },
          {
            name: "productCode",
            in: "query",
            description: "Filter by product code",
            schema: {
              type: "string"
            }
          },
          {
            name: "dateFrom",
            in: "query",
            description: "Filter alerts created after this date (ISO 8601)",
            schema: {
              type: "string",
              format: "date-time"
            }
          },
          {
            name: "dateTo",
            in: "query",
            description: "Filter alerts created before this date (ISO 8601)",
            schema: {
              type: "string",
              format: "date-time"
            }
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true
                    },
                    data: {
                      type: "object",
                      properties: {
                        alerts: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: {
                                type: "string",
                                format: "uuid",
                                example: "123e4567-e89b-12d3-a456-426614174000"
                              },
                              productCode: {
                                type: "string",
                                example: "PROD001"
                              },
                              productDescription: {
                                type: "string",
                                example: "Product Description"
                              },
                              currentStock: {
                                type: "number",
                                example: 50.5
                              },
                              minimumStock: {
                                type: "number",
                                example: 100
                              },
                              severity: {
                                type: "string",
                                enum: ["critical", "warning", "info"],
                                example: "critical"
                              },
                              status: {
                                type: "string",
                                enum: ["active", "resolved", "acknowledged"],
                                example: "active"
                              },
                              createdAt: {
                                type: "string",
                                format: "date-time",
                                example: "2024-01-01T12:00:00Z"
                              },
                              resolvedAt: {
                                type: "string",
                                format: "date-time",
                                example: "2024-01-02T12:00:00Z"
                              },
                              metadata: {
                                type: "object",
                                additionalProperties: true
                              }
                            }
                          }
                        },
                        total: {
                          type: "integer",
                          example: 150
                        },
                        page: {
                          type: "integer",
                          example: 1
                        },
                        pageSize: {
                          type: "integer",
                          example: 20
                        },
                        statistics: {
                          type: "object",
                          properties: {
                            critical: {
                              type: "integer",
                              example: 10
                            },
                            warning: {
                              type: "integer",
                              example: 5
                            },
                            info: {
                              type: "integer",
                              example: 2
                            },
                            active: {
                              type: "integer",
                              example: 15
                            },
                            resolved: {
                              type: "integer",
                              example: 2
                            },
                            acknowledged: {
                              type: "integer",
                              example: 0
                            }
                          }
                        }
                      }
                    },
                    message: {
                      type: "string",
                      example: "Alertas de estoque recuperados com sucesso"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid query parameters",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: false
                    },
                    error: {
                      type: "string",
                      example: "Parâmetros de consulta inválidos"
                    },
                    details: {
                      type: "string",
                      example: "Validation error details"
                    }
                  }
                }
              }
            }
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: false
                    },
                    error: {
                      type: "string",
                      example: "Erro interno ao processar solicitação"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/alerts/stock/critical": {
      get: {
        tags: ["alerts"],
        summary: "List critical stock alerts",
        description: "Retrieve only critical stock alerts that are not resolved",
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number for pagination",
            schema: {
              type: "integer",
              minimum: 1,
              default: 1
            }
          },
          {
            name: "pageSize",
            in: "query",
            description: "Number of items per page",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20
            }
          },
          {
            name: "productCode",
            in: "query",
            description: "Filter by product code",
            schema: {
              type: "string"
            }
          },
          {
            name: "dateFrom",
            in: "query",
            description: "Filter alerts created after this date (ISO 8601)",
            schema: {
              type: "string",
              format: "date-time"
            }
          },
          {
            name: "dateTo",
            in: "query",
            description: "Filter alerts created before this date (ISO 8601)",
            schema: {
              type: "string",
              format: "date-time"
            }
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StockAlertsResponse"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "500": {
            $ref: "#/components/responses/InternalServerError"
          }
        }
      }
    },
    "/api/alerts/stock/configure": {
      post: {
        tags: ["alerts"],
        summary: "Configure stock alert rules",
        description: "Configure thresholds and notification channels for stock alerts",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  productCode: {
                    type: "string",
                    description: "Product code (optional, applies to all if not specified)",
                    example: "PROD001"
                  },
                  criticalThreshold: {
                    type: "number",
                    description: "Critical stock threshold",
                    minimum: 0,
                    example: 10
                  },
                  warningThreshold: {
                    type: "number",
                    description: "Warning stock threshold",
                    minimum: 0,
                    example: 25
                  },
                  notificationChannels: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["email", "sms", "dashboard"]
                    },
                    description: "Channels to send notifications",
                    example: ["email", "dashboard"]
                  },
                  autoResolveDays: {
                    type: "integer",
                    description: "Days to auto-resolve alerts",
                    minimum: 1,
                    example: 7
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Configuration updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true
                    },
                    data: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          format: "uuid",
                          example: "123e4567-e89b-12d3-a456-426614174000"
                        },
                        productCode: {
                          type: "string",
                          example: "PROD001"
                        },
                        criticalThreshold: {
                          type: "number",
                          example: 10
                        },
                        warningThreshold: {
                          type: "number",
                          example: 25
                        },
                        notificationChannels: {
                          type: "array",
                          items: {
                            type: "string"
                          },
                          example: ["email", "dashboard"]
                        },
                        autoResolveDays: {
                          type: "integer",
                          example: 7
                        },
                        createdAt: {
                          type: "string",
                          format: "date-time",
                          example: "2024-01-01T12:00:00Z"
                        },
                        updatedAt: {
                          type: "string",
                          format: "date-time",
                          example: "2024-01-01T12:00:00Z"
                        }
                      }
                    },
                    message: {
                      type: "string",
                      example: "Configuração de alertas atualizada com sucesso"
                    }
                  }
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "500": {
            $ref: "#/components/responses/InternalServerError"
          }
        }
      }
    },
    "/api/alerts/stock/{id}/status": {
      patch: {
        tags: ["alerts"],
        summary: "Update alert status",
        description: "Update the status of a specific stock alert (resolve or acknowledge)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Alert ID",
            schema: {
              type: "string",
              format: "uuid"
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["resolved", "acknowledged"],
                    example: "resolved"
                  },
                  notes: {
                    type: "string",
                    description: "Optional notes about status change",
                    example: "Stock replenished"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Status updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true
                    },
                    data: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          format: "uuid",
                          example: "123e4567-e89b-12d3-a456-426614174000"
                        },
                        status: {
                          type: "string",
                          example: "resolved"
                        },
                        resolvedAt: {
                          type: "string",
                          format: "date-time",
                          example: "2024-01-02T12:00:00Z"
                        },
                        updatedAt: {
                          type: "string",
                          format: "date-time",
                          example: "2024-01-02T12:00:00Z"
                        }
                      }
                    },
                    message: {
                      type: "string",
                      example: "Status do alerta atualizado com sucesso"
                    }
                  }
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "404": {
            description: "Alert not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: false
                    },
                    error: {
                      type: "string",
                      example: "Alerta não encontrado"
                    }
                  }
                }
              }
            }
          },
          "500": {
            $ref: "#/components/responses/InternalServerError"
          }
        }
      }
    },
    "/api/alerts/stock/statistics": {
      get: {
        tags: ["alerts"],
        summary: "Get alert statistics",
        description: "Retrieve statistics about stock alerts",
        parameters: [
          {
            name: "severity",
            in: "query",
            description: "Filter by alert severity",
            schema: {
              type: "string",
              enum: ["critical", "warning", "info"]
            }
          },
          {
            name: "resolved",
            in: "query",
            description: "Filter by resolution status",
            schema: {
              type: "boolean"
            }
          },
          {
            name: "productCode",
            in: "query",
            description: "Filter by product code",
            schema: {
              type: "string"
            }
          },
          {
            name: "dateFrom",
            in: "query",
            description: "Filter alerts created after this date (ISO 8601)",
            schema: {
              type: "string",
              format: "date-time"
            }
          },
          {
            name: "dateTo",
            in: "query",
            description: "Filter alerts created before this date (ISO 8601)",
            schema: {
              type: "string",
              format: "date-time"
            }
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true
                    },
                    data: {
                      type: "object",
                      properties: {
                        total: {
                          type: "integer",
                          example: 150
                        },
                        critical: {
                          type: "integer",
                          example: 10
                        },
                        warning: {
                          type: "integer",
                          example: 5
                        },
                        info: {
                          type: "integer",
                          example: 2
                        },
                        active: {
                          type: "integer",
                          example: 15
                        },
                        resolved: {
                          type: "integer",
                          example: 2
                        },
                        acknowledged: {
                          type: "integer",
                          example: 0
                        }
                      }
                    },
                    message: {
                      type: "string",
                      example: "Estatísticas de alertas recuperadas com sucesso"
                    }
                  }
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "500": {
            $ref: "#/components/responses/InternalServerError"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      StockAlertsResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true
          },
          data: {
            type: "object",
            properties: {
              alerts: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/StockAlert"
                }
              },
              total: {
                type: "integer",
                example: 150
              },
              page: {
                type: "integer",
                example: 1
              },
              pageSize: {
                type: "integer",
                example: 20
              },
              statistics: {
                type: "object",
                properties: {
                  critical: {
                    type: "integer",
                    example: 10
                  },
                  warning: {
                    type: "integer",
                    example: 5
                  },
                  info: {
                    type: "integer",
                    example: 2
                  },
                  active: {
                    type: "integer",
                    example: 15
                  },
                  resolved: {
                    type: "integer",
                    example: 2
                  },
                  acknowledged: {
                    type: "integer",
                    example: 0
                  }
                }
              }
            }
          },
          message: {
            type: "string",
            example: "Alertas de estoque recuperados com sucesso"
          }
        }
      },
      StockAlert: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "123e4567-e89b-12d3-a456-426614174000"
          },
          productCode: {
            type: "string",
            example: "PROD001"
          },
          productDescription: {
            type: "string",
            example: "Product Description"
          },
          currentStock: {
            type: "number",
            example: 50.5
          },
          minimumStock: {
            type: "number",
            example: 100
          },
          severity: {
            type: "string",
            enum: ["critical", "warning", "info"],
            example: "critical"
          },
          status: {
            type: "string",
            enum: ["active", "resolved", "acknowledged"],
            example: "active"
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T12:00:00Z"
          },
          resolvedAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-02T12:00:00Z"
          },
          metadata: {
            type: "object",
            additionalProperties: true
          }
        }
      }
    },
    responses: {
      BadRequest: {
        description: "Invalid request parameters",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: false
                },
                error: {
                  type: "string",
                  example: "Parâmetros de consulta inválidos"
                },
                details: {
                  type: "string",
                  example: "Validation error details"
                }
              }
            }
          }
        }
      },
      InternalServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: false
                },
                error: {
                  type: "string",
                  example: "Erro interno ao processar solicitação"
                }
              }
            }
          }
        }
      }
    }
  }
};