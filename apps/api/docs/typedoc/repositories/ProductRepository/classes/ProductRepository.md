[**@production-manager/api**](../../../README.md)

***

# Class: ProductRepository

Defined in: [repositories/ProductRepository.ts:4](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/ProductRepository.ts#L4)

## Constructors

### Constructor

> **new ProductRepository**(): `ProductRepository`

#### Returns

`ProductRepository`

## Methods

### findById()

> **findById**(`id`): `Promise`\<\{ \} \| `null`\>

Defined in: [repositories/ProductRepository.ts:5](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/ProductRepository.ts#L5)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<\{ \} \| `null`\>

***

### findByOmieId()

> **findByOmieId**(`omieProductId`): `Promise`\<\{ \} \| `null`\>

Defined in: [repositories/ProductRepository.ts:11](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/ProductRepository.ts#L11)

#### Parameters

##### omieProductId

`string`

#### Returns

`Promise`\<\{ \} \| `null`\>

***

### create()

> **create**(`data`): `Promise`\<\{ \}\>

Defined in: [repositories/ProductRepository.ts:17](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/ProductRepository.ts#L17)

#### Parameters

##### data

`ProductUncheckedCreateInput`

#### Returns

`Promise`\<\{ \}\>

***

### delete()

> **delete**(`id`): `Promise`\<\{ \}\>

Defined in: [repositories/ProductRepository.ts:23](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/ProductRepository.ts#L23)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<\{ \}\>

***

### findAllWithDetails()

> **findAllWithDetails**(): `Promise`\<`object` & `object`[]\>

Defined in: [repositories/ProductRepository.ts:29](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/ProductRepository.ts#L29)

#### Returns

`Promise`\<`object` & `object`[]\>

***

### findProductSector()

> **findProductSector**(`productId`): `Promise`\<\{ \} \| `null`\>

Defined in: [repositories/ProductRepository.ts:49](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/ProductRepository.ts#L49)

#### Parameters

##### productId

`string`

#### Returns

`Promise`\<\{ \} \| `null`\>

***

### upsertProductSector()

> **upsertProductSector**(`productId`, `sectorId`, `notes?`): `Promise`\<\{ \}\>

Defined in: [repositories/ProductRepository.ts:55](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/ProductRepository.ts#L55)

#### Parameters

##### productId

`string`

##### sectorId

`string`

##### notes?

`string`

#### Returns

`Promise`\<\{ \}\>
