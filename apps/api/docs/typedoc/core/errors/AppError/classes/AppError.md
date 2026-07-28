[**@production-manager/api**](../../../../README.md)

***

# Class: AppError

Defined in: [core/errors/AppError.ts:1](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/core/errors/AppError.ts#L1)

## Extends

- `Error`

## Constructors

### Constructor

> **new AppError**(`code`, `statusCode`, `message`, `details?`): `AppError`

Defined in: [core/errors/AppError.ts:6](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/core/errors/AppError.ts#L6)

#### Parameters

##### code

`string`

##### statusCode

`number`

##### message

`string`

##### details?

`any`

#### Returns

`AppError`

#### Overrides

`Error.constructor`

## Properties

### code

> **code**: `string`

Defined in: [core/errors/AppError.ts:2](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/core/errors/AppError.ts#L2)

***

### statusCode

> **statusCode**: `number`

Defined in: [core/errors/AppError.ts:3](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/core/errors/AppError.ts#L3)

***

### details?

> `optional` **details?**: `any`

Defined in: [core/errors/AppError.ts:4](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/core/errors/AppError.ts#L4)
