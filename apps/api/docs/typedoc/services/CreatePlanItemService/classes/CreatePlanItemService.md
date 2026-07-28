[**@production-manager/api**](../../../README.md)

***

# Class: CreatePlanItemService

Defined in: [services/CreatePlanItemService.ts:6](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/services/CreatePlanItemService.ts#L6)

## Constructors

### Constructor

> **new CreatePlanItemService**(`planRepo?`, `productRepo?`, `sectorRepo?`): `CreatePlanItemService`

Defined in: [services/CreatePlanItemService.ts:7](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/services/CreatePlanItemService.ts#L7)

#### Parameters

##### planRepo?

[`PlanRepository`](../../../repositories/PlanRepository/classes/PlanRepository.md) = `...`

##### productRepo?

[`ProductRepository`](../../../repositories/ProductRepository/classes/ProductRepository.md) = `...`

##### sectorRepo?

[`SectorRepository`](../../../repositories/SectorRepository/classes/SectorRepository.md) = `...`

#### Returns

`CreatePlanItemService`

## Methods

### execute()

> **execute**(`__namedParameters`): `Promise`\<\{ \}\>

Defined in: [services/CreatePlanItemService.ts:13](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/services/CreatePlanItemService.ts#L13)

#### Parameters

##### \_\_namedParameters

###### planId

`string`

###### productId

`string`

###### quantity

`number`

###### sectorId?

`string`

###### notes?

`string`

#### Returns

`Promise`\<\{ \}\>
