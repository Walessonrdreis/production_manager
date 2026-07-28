[**@production-manager/api**](../../../README.md)

***

# Class: SectorRepository

Defined in: [repositories/SectorRepository.ts:4](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/SectorRepository.ts#L4)

## Constructors

### Constructor

> **new SectorRepository**(): `SectorRepository`

#### Returns

`SectorRepository`

## Methods

### findById()

> **findById**(`id`): `Promise`\<\{ \} \| `null`\>

Defined in: [repositories/SectorRepository.ts:5](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/SectorRepository.ts#L5)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<\{ \} \| `null`\>

***

### findByName()

> **findByName**(`name`): `Promise`\<\{ \} \| `null`\>

Defined in: [repositories/SectorRepository.ts:11](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/SectorRepository.ts#L11)

#### Parameters

##### name

`string`

#### Returns

`Promise`\<\{ \} \| `null`\>

***

### findAll()

> **findAll**(`includeInactive?`): `Promise`\<`object`[]\>

Defined in: [repositories/SectorRepository.ts:17](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/SectorRepository.ts#L17)

#### Parameters

##### includeInactive?

`boolean` = `false`

#### Returns

`Promise`\<`object`[]\>

***

### create()

> **create**(`data`): `Promise`\<\{ \}\>

Defined in: [repositories/SectorRepository.ts:27](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/SectorRepository.ts#L27)

#### Parameters

##### data

`SectorCreateInput`

#### Returns

`Promise`\<\{ \}\>

***

### update()

> **update**(`id`, `data`): `Promise`\<\{ \}\>

Defined in: [repositories/SectorRepository.ts:33](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/SectorRepository.ts#L33)

#### Parameters

##### id

`string`

##### data

`SectorUpdateInput`

#### Returns

`Promise`\<\{ \}\>

***

### softDelete()

> **softDelete**(`id`): `Promise`\<\{ \}\>

Defined in: [repositories/SectorRepository.ts:40](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/repositories/SectorRepository.ts#L40)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<\{ \}\>
