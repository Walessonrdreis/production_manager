[**@production-manager/api**](../../../../README.md)

***

# Class: OmieStockCache

Defined in: [integrations/omie/OmieStockCache.ts:27](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/integrations/omie/OmieStockCache.ts#L27)

## Constructors

### Constructor

> **new OmieStockCache**(): `OmieStockCache`

#### Returns

`OmieStockCache`

## Methods

### getSnapshot()

> **getSnapshot**(): `Promise`\<`Map`\<`string`, `OmieStockEntry`\>\>

Defined in: [integrations/omie/OmieStockCache.ts:33](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/integrations/omie/OmieStockCache.ts#L33)

#### Returns

`Promise`\<`Map`\<`string`, `OmieStockEntry`\>\>

***

### getLastUpdatedAt()

> **getLastUpdatedAt**(): `string` \| `null`

Defined in: [integrations/omie/OmieStockCache.ts:53](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/integrations/omie/OmieStockCache.ts#L53)

#### Returns

`string` \| `null`

***

### refreshNow()

> **refreshNow**(): `Promise`\<`Map`\<`string`, `OmieStockEntry`\>\>

Defined in: [integrations/omie/OmieStockCache.ts:57](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/integrations/omie/OmieStockCache.ts#L57)

#### Returns

`Promise`\<`Map`\<`string`, `OmieStockEntry`\>\>
