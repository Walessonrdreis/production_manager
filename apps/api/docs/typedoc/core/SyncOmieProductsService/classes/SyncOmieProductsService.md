[**@production-manager/api**](../../../README.md)

***

# Class: SyncOmieProductsService

Defined in: [core/SyncOmieProductsService.ts:17](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/core/SyncOmieProductsService.ts#L17)

## Constructors

### Constructor

> **new SyncOmieProductsService**(): `SyncOmieProductsService`

#### Returns

`SyncOmieProductsService`

## Methods

### execute()

> **execute**(`requestId`, `force?`): `Promise`\<\{ `upserted?`: `number`; `failed?`: `number`; `skipped?`: `boolean`; `reason?`: `string`; `nextAllowedInSec?`: `number`; \}\>

Defined in: [core/SyncOmieProductsService.ts:93](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/core/SyncOmieProductsService.ts#L93)

#### Parameters

##### requestId

`string`

##### force?

`boolean` = `false`

#### Returns

`Promise`\<\{ `upserted?`: `number`; `failed?`: `number`; `skipped?`: `boolean`; `reason?`: `string`; `nextAllowedInSec?`: `number`; \}\>
