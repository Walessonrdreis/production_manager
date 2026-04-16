[**@production-manager/api**](../../../README.md)

***

# Class: AppError

Defined in: [utils/domainErrors.ts:3](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/utils/domainErrors.ts#L3)

## Extends

- `Error`

## Extended by

- [`NotFoundError`](NotFoundError.md)
- [`ConflictError`](ConflictError.md)
- [`ValidationError`](ValidationError.md)
- [`MissingDefaultSectorError`](MissingDefaultSectorError.md)

## Constructors

### Constructor

> **new AppError**(`code`, `statusCode`, `message`, `details?`): `AppError`

Defined in: [utils/domainErrors.ts:8](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/utils/domainErrors.ts#L8)

#### Parameters

##### code

[`ErrorCode`](../../errors/type-aliases/ErrorCode.md)

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

> **code**: [`ErrorCode`](../../errors/type-aliases/ErrorCode.md)

Defined in: [utils/domainErrors.ts:4](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/utils/domainErrors.ts#L4)

***

### statusCode

> **statusCode**: `number`

Defined in: [utils/domainErrors.ts:5](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/utils/domainErrors.ts#L5)

***

### details?

> `optional` **details?**: `any`

Defined in: [utils/domainErrors.ts:6](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/utils/domainErrors.ts#L6)
