[**@production-manager/api**](../../../README.md)

***

# Function: sendPaginated()

> **sendPaginated**\<`T`\>(`request`, `reply`, `data`, `meta`, `links?`): `FastifyReply`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `RouteGenericInterface`, `unknown`, `FastifySchema`, `FastifyTypeProviderDefault`, `unknown`\>

Defined in: [lib/http.ts:125](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/lib/http.ts#L125)

Send paginated() response, optionally pretty-printed.

## Type Parameters

### T

`T`

## Parameters

### request

`FastifyRequest`

### reply

`FastifyReply`

### data

`T`[]

### meta

[`PaginationMeta`](../type-aliases/PaginationMeta.md)

### links?

[`HttpLinks`](../type-aliases/HttpLinks.md)

## Returns

`FastifyReply`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `RouteGenericInterface`, `unknown`, `FastifySchema`, `FastifyTypeProviderDefault`, `unknown`\>
