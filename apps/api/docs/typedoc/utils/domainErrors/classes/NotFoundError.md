[**@production-manager/api**](../../../README.md)

***

# Class: NotFoundError

Defined in: [utils/domainErrors.ts:27](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/utils/domainErrors.ts#L27)

## Extends

- [`AppError`](AppError.md)

## Constructors

### Constructor

> **new NotFoundError**(`resource`): `NotFoundError`

Defined in: [utils/domainErrors.ts:28](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/utils/domainErrors.ts#L28)

#### Parameters

##### resource

`string`

#### Returns

`NotFoundError`

#### Overrides

[`AppError`](AppError.md).[`constructor`](AppError.md#constructor)

## Properties

### code

> **code**: [`ErrorCode`](../../errors/type-aliases/ErrorCode.md)

Defined in: [utils/domainErrors.ts:4](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/utils/domainErrors.ts#L4)

#### Inherited from

[`AppError`](AppError.md).[`code`](AppError.md#code)

***

### statusCode

> **statusCode**: `number`

Defined in: [utils/domainErrors.ts:5](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/utils/domainErrors.ts#L5)

#### Inherited from

[`AppError`](AppError.md).[`statusCode`](AppError.md#statuscode)

***

### details?

> `optional` **details?**: `any`

Defined in: [utils/domainErrors.ts:6](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/utils/domainErrors.ts#L6)

#### Inherited from

[`AppError`](AppError.md).[`details`](AppError.md#details)
