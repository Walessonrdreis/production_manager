[**@production-manager/api**](../../../README.md)

***

# Function: sendError()

> **sendError**(`reply`, `status`, `code`, `message`, `details?`): `FastifyReply`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `RouteGenericInterface`, `unknown`, `FastifySchema`, `FastifyTypeProviderDefault`, `unknown`\>

Defined in: [utils/errors.ts:29](https://github.com/Walessonrdreis/production_manager/blob/a1c95e80f1b276b219f01740472a3cf88ad3adf6/apps/api/src/utils/errors.ts#L29)

Utilitário para enviar respostas de erro padronizadas.

## Parameters

### reply

`FastifyReply`

FastifyReply instance

### status

`number`

HTTP Status Code (ex: 400, 404, 500)

### code

[`ErrorCode`](../type-aliases/ErrorCode.md)

Código do erro do enum ErrorCodes

### message

`string`

Mensagem legível para o usuário ou log

### details?

`any`

Detalhes adicionais opcionais (ex: campos de validação)

## Returns

`FastifyReply`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `RouteGenericInterface`, `unknown`, `FastifySchema`, `FastifyTypeProviderDefault`, `unknown`\>
