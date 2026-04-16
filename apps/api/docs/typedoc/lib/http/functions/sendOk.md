[**@production-manager/api**](../../../README.md)

***

# Function: sendOk()

> **sendOk**\<`T`\>(`request`, `reply`, `data`, `meta?`, `links?`): `FastifyReply`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `RouteGenericInterface`, `unknown`, `FastifySchema`, `FastifyTypeProviderDefault`, `unknown`\>

Defined in: [lib/http.ts:105](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/lib/http.ts#L105)

Send ok() response, optionally pretty-printed.
Use this in endpoints where human readability matters (/, /v1, etc).

## Type Parameters

### T

`T`

## Parameters

### request

`FastifyRequest`

### reply

`FastifyReply`

### data

`T`

### meta?

`Record`\<`string`, `unknown`\>

### links?

[`HttpLinks`](../type-aliases/HttpLinks.md)

## Returns

`FastifyReply`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `RouteGenericInterface`, `unknown`, `FastifySchema`, `FastifyTypeProviderDefault`, `unknown`\>
