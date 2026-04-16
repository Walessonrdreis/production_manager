[**@production-manager/api**](../../../../README.md)

***

# Class: OmieAdapter

Defined in: [integrations/omie/OmieAdapter.ts:9](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/integrations/omie/OmieAdapter.ts#L9)

## Constructors

### Constructor

> **new OmieAdapter**(): `OmieAdapter`

#### Returns

`OmieAdapter`

## Methods

### extractProductCode()

> `static` **extractProductCode**(`raw`): `string`

Defined in: [integrations/omie/OmieAdapter.ts:46](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/integrations/omie/OmieAdapter.ts#L46)

#### Parameters

##### raw

`any`

#### Returns

`string`

***

### extractStockProductCode()

> `static` **extractStockProductCode**(`raw`): `string`

Defined in: [integrations/omie/OmieAdapter.ts:51](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/integrations/omie/OmieAdapter.ts#L51)

#### Parameters

##### raw

`any`

#### Returns

`string`

***

### extractStockQuantity()

> `static` **extractStockQuantity**(`raw`): `string` \| `null`

Defined in: [integrations/omie/OmieAdapter.ts:64](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/integrations/omie/OmieAdapter.ts#L64)

#### Parameters

##### raw

`any`

#### Returns

`string` \| `null`

***

### extractMinimumStock()

> `static` **extractMinimumStock**(`raw`): `string` \| `null`

Defined in: [integrations/omie/OmieAdapter.ts:81](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/integrations/omie/OmieAdapter.ts#L81)

#### Parameters

##### raw

`any`

#### Returns

`string` \| `null`

***

### extractFamilyDescription()

> `static` **extractFamilyDescription**(`raw`): `string` \| `null`

Defined in: [integrations/omie/OmieAdapter.ts:93](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/integrations/omie/OmieAdapter.ts#L93)

#### Parameters

##### raw

`any`

#### Returns

`string` \| `null`

***

### toProductDTO()

> `static` **toProductDTO**(`raw`): [`OmieProductDTO`](../type-aliases/OmieProductDTO.md)

Defined in: [integrations/omie/OmieAdapter.ts:104](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/integrations/omie/OmieAdapter.ts#L104)

#### Parameters

##### raw

`any`

#### Returns

[`OmieProductDTO`](../type-aliases/OmieProductDTO.md)
