[**@production-manager/api**](../../../README.md)

***

# Class: PlanRepository

Defined in: [repositories/PlanRepository.ts:4](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/PlanRepository.ts#L4)

## Constructors

### Constructor

> **new PlanRepository**(): `PlanRepository`

#### Returns

`PlanRepository`

## Methods

### findById()

> **findById**(`id`): `Promise`\<\{ \} \| `null`\>

Defined in: [repositories/PlanRepository.ts:5](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/PlanRepository.ts#L5)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<\{ \} \| `null`\>

***

### findByIdWithDetails()

> **findByIdWithDetails**(`id`): `Promise`\<`object` & `object` \| `null`\>

Defined in: [repositories/PlanRepository.ts:11](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/PlanRepository.ts#L11)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`object` & `object` \| `null`\>

***

### findAll()

> **findAll**(): `Promise`\<`object`[]\>

Defined in: [repositories/PlanRepository.ts:25](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/PlanRepository.ts#L25)

#### Returns

`Promise`\<`object`[]\>

***

### create()

> **create**(`data`): `Promise`\<\{ \}\>

Defined in: [repositories/PlanRepository.ts:31](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/PlanRepository.ts#L31)

#### Parameters

##### data

`ProductionPlanCreateInput`

#### Returns

`Promise`\<\{ \}\>

***

### createItem()

> **createItem**(`data`): `Promise`\<\{ \}\>

Defined in: [repositories/PlanRepository.ts:39](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/PlanRepository.ts#L39)

#### Parameters

##### data

`ProductionPlanItemUncheckedCreateInput`

#### Returns

`Promise`\<\{ \}\>
