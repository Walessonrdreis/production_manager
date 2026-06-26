# Production Manager — Regras de Respostas

## 🗣️ Comportamento do Agente

### Modo Diálogo (sem código)

- **"não code"** ou **"não implementar"**: responda **apenas via chat**, sem gerar código.
- **"documentar"** ou **"documente"**: responda via chat **e** crie o arquivo `.md` explicando o que foi criado.
- **"crie os passos"** ou **"crie os passos de implementação"**: responda via chat listando os passos, sem codificar.
- **"Vamos conversar"** ou frases semelhantes: responda **apenas via chat**, sem codificar nada. Ajude a construir ideias, melhorias e validações seguindo padrões de projetos e boas práticas. Só code quando for dito **"pode codar"**.
- Enquanto **não** for dito **"pode codar"**, não gere nenhum código — mantenha o diálogo de construção de ideias.
- Quando encontrar um bug no sistema, descreva o problema e sugira soluções, mas **não** implemente correções até que seja dito **"pode codar"**.

### Modo Codificação

- **"pode codar"**: autorização para gerar código. Siga os passos definidos na conversa, **um passo por vez**.

### 🧹 Cleanup pós-teste

- Após testar alterações (curl, refresh, etc.), **sempre mate o servidor de dev** imediatamente.
- Não mantenha servidores rodando entre interações — terminou os testes, encerre o processo.
- Use `Get-Process -Id (Get-NetTCPConnection -LocalPort 3333).OwningProcess | Stop-Process -Force` no Windows ou `taskkill /F /PID <pid>`.
- Verificar portas ocupadas com `netstat -ano | findstr :PORTA` antes de iniciar novo servidor.

---

## 📂 Diretórios Base para Contexto

Sempre busque informações nestes diretórios ao analisar o projeto:

```
apps/api/prisma
apps/api/src
apps/api/src/@types
apps/api/src/bootstrap
apps/api/src/config
apps/api/src/shared
apps/api/src/modules/integration
```

### Módulos de Integração

```
apps/api/src/modules/integration
```

### Módulo de Referência (Modelo)

```
apps/api/src/modules/integration/product-structure
```

---

## 📚 Documentação de Referência

Consulte os documentos em `docs/` para regras detalhadas:

- `docs/MODULE_TEMPLATE.md` — Template canônico para novos módulos
- `docs/MODULE_QUALITY_GATE.md` — Checklist canônico (119 itens) para avaliar maturidade de módulos
- `docs/PROJECT_MANUAL.md` — Manual completo com padrões de nomenclatura e arquitetura
- `docs/DOMAIN_NAMING_GUIDE.md` — Nomenclatura de domínio
- `docs/DECISIONS.md` — ADRs (Architectural Decision Records)
- `docs/ARCHITECTURE_GUIDE.md` — Guia de arquitetura técnica

## 🔧 Comandos do Projeto

```bash
# Desenvolvimento
pnpm --filter @production-manager/api dev

# Gerar Prisma
pnpm --filter @production-manager/api prisma:generate

# Studio Prisma
pnpm --filter @production-manager/api db:studio
```

## 🏗️ Arquitetura Base

```
API 1 (Fastify) → Integração com Omie (espelho local)
API 2            → Domínio/UX (consome read-models da API 1)
Frontend         → Interface do usuário (chama apenas API 2)
```

**Regras de Ouro:**
- Frontend nunca chama Omie ou API 1 diretamente
- API 2 nunca chama Omie
- Apenas API 1 fala com Omie via gateways (real/fake)
- Read-models não executam efeitos colaterais
- Comandos de integração sempre usam `externalRequestId` (idempotência)
- Comandos retornam 202 Accepted (eventual-consistente)
