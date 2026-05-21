---
alwaysApply: true
scene: development
---
# SRP GLOBAL - RESPONSABILIDADE ÚNICA

## REGRA 1: 1 ARQUIVO = 1 INTENÇÃO
- Se arquivo faz "Fetch e Normalização", dividir em dois
- Cada arquivo tem uma única responsabilidade
- Nomes devem refletir exatamente a intenção

## REGRA 2: PADRÃO DE NOMENCLATURA
- **Verbo + Objeto**: `GetSectors.ts`, `NormalizeProduct.ts`
- **UseCases**: `SyncProductionOrders.usecase.ts`
- **Repositories**: `ProductionOrders.repo.prisma.ts`
- **Controllers**: `ProductionOrders.controller.ts`
- **Jobs**: `SyncProductionOrders.job.ts`

## REGRA 3: CRESCIMENTO ORGÂNICO
- Se arquivo ultrapassar responsabilidade única, fragmentar imediatamente
- Monitorar tamanho de arquivo (> 200 linhas = alerta)
- Dividir antes que fique complexo

## REGRA 4: SINAIS DE ALERTA
- Teste exige muitos mocks complexos = arquivo grande demais
- Dificuldade para nomear arquivo = responsabilidade confusa
- Muitos imports diferentes = acoplamento excessivo

## REGRA 5: HIERARQUIA DE RESPONSABILIDADES
1. **Presentation**: Controllers, Routes, Schemas
2. **Application**: UseCases, DTOs, Ports
3. **Infrastructure**: Repositories, Gateways, Jobs
4. **Domain**: Entities, Value Objects, Errors

## REGRA 6: DEPENDÊNCIA UNIDIRECIONAL
- Camadas superiores dependem de inferiores
- Nunca referenciar presentation em domain
- Use ports/interfaces para abstração

## REGRA 7: REFATORAÇÃO PROATIVA
- Identificar violações do SRP diariamente
- Refatorar antes que cause problemas
- Manter arquivos focados e coesos