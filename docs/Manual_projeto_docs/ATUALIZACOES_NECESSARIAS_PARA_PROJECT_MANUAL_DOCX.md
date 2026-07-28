# ATUALIZAÇÕES NECESSÁRIAS PARA PROJECT_MANUAL.docx

## 📋 RESUMO DAS LACUNAS IDENTIFICADAS

O `PROJECT_MANUAL.docx` atual está bem estruturado, mas **faltam informações críticas** identificadas durante a evolução do projeto:

1. **Não especifica os 4 arquivos obrigatórios para atualização** ao criar novo módulo
2. **Não referencia o `DOMAIN_NAMING_GUIDE.md`** (criado para resolver tensão conceitual)
3. **Usa exemplo problemático `orders-sync`** em vez do canônico `sales-order-sync`
4. **Falta referência cruzada completa** com documentos de decisões arquiteturais

---

## 🎯 ATUALIZAÇÕES ESPECÍFICAS NECESSÁRIAS

### 1. ADICIONAR SEÇÃO: "📄 ARQUIVOS OBRIGATÓRIOS PARA ATUALIZAÇÃO"

**Localização sugerida**: Após a seção "📦 TEMPLATE DE MÓDULO" (antes de "🗄️ PADRÃO CANÔNICO DO BANCO DE DADOS")

**Conteúdo sugerido**:

```
## 📄 ARQUIVOS OBRIGATÓRIOS PARA ATUALIZAÇÃO

Ao criar um **novo módulo de integração**, você **DEVE** atualizar **4 arquivos obrigatórios** para manter a consistência arquitetural do projeto:

### 1️⃣ `apps/api/src/bootstrap/routes.ts`
**Propósito**: Registrar o módulo no sistema de rotas da API 1
**Obrigatório**: ✅ SIM (sempre)
**Exemplo**:
```typescript
import { criarIntegracaoSalesOrderSync } from "@/modules/integration/sales-order-sync";

const integrations = [
  // ... outras integrações
  criarIntegracaoSalesOrderSync(),
];
```

### 2️⃣ `apps/api/ROUTES.md`
**Propósito**: Documentar as rotas públicas seguindo template canônico
**Obrigatório**: ✅ SIM (sempre)
**Exemplo**: Copiar seção "📋 TEMPLATE PARA NOVOS MÓDULOS" e substituir `[nome-do-modulo]` por nome canônico

### 3️⃣ `docs/DECISIONS.md` (se aplicável)
**Propósito**: Documentar decisões arquiteturais específicas do módulo
**Obrigatório**: 🟡 CONTEXTUAL (apenas se houver decisão não‑óbvia)
**Quando usar**: 
- Módulo introduz novo padrão de integração
- Decisão afeta múltiplos módulos futuros
- Trade-off significativo foi considerado

### 4️⃣ `docs/DB_SCHEMA_GUIDE.md` (se aplicável)
**Propósito**: Documentar schema específico do módulo
**Obrigatório**: 🟡 CONTEXTUAL (apenas se criar novas tabelas)
**Quando usar**: 
- Módulo requer novas tabelas no banco
- Schema segue padrão canônico diferente
- Precisa documentar relações complexas

### 📌 CHECKLIST DE COMPLIANCE
- [ ] Módulo registrado em `bootstrap/routes.ts`
- [ ] Rotas documentadas em `ROUTES.md` seguindo template
- [ ] Nome canônico segue `DOMAIN_NAMING_GUIDE.md`
- [ ] Decisões arquiteturais registradas (se aplicável)
- [ ] Schema documentado (se aplicável)
```

### 2. ATUALIZAR REFERÊNCIAS AO `DOMAIN_NAMING_GUIDE.md`

**Localizações para atualizar**:

1. **Na seção "🔤 Padrões de Nomenclatura"**:
   - Adicionar referência: "Para semântica de domínio, consulte `DOMAIN_NAMING_GUIDE.md`"

2. **Na seção "📦 TEMPLATE DE MÓDULO"** (subseção 6. "EXEMPLO COMPLETO"):
   - Adicionar nota explicativa sobre por que usar `sales-order-sync` em vez de `orders-sync`
   - Referenciar `DOMAIN_NAMING_GUIDE.md` como fonte de padrões canônicos

3. **Na seção "📚 DOCUMENTAÇÃO RELACIONADA"**:
   - Adicionar `DOMAIN_NAMING_GUIDE.md` à lista de documentos relacionados

**Conteúdo sugerido para adicionar**:

```
> **📌 DOCUMENTAÇÃO RELACIONADA**:
> - [PROJECT_MANUAL.md](PROJECT_MANUAL.md) - Autoridade máxima do projeto
> - [DECISIONS.md](DECISIONS.md) - Decisões arquiteturais fundamentais (ADR)
> - [DOMAIN_NAMING_GUIDE.md](DOMAIN_NAMING_GUIDE.md) - Guia canônico de nomenclatura de domínio
> - [ARCHITECTURE_GUIDE.md](ARCHITECTURE_GUIDE.md) - Arquitetura técnica detalhada
```

### 3. CORRIGIR EXEMPLO `orders-sync` PARA `sales-order-sync`

**Localizações para atualizar**:

1. **Em toda a seção de exemplo do módulo**:
   - Substituir `orders-sync` por `sales-order-sync`
   - Atualizar nomes de arquivos, funções e referências

2. **Adicionar nota explicativa**:

```
> **⚠️ IMPORTANTE**: Usamos `sales-order-sync` (específico) em vez de `orders-sync` (genérico) para:
> - **Clareza de domínio**: "sales order" vs "production order" vs "purchase order"
> - **Ownership explícito**: API 1 escreve espelho Omie, API 2 escreve domínio interno
> - **Consistência canônica**: Segue padrão "entidade específica + capacidade"
> 
> **📌 Consulte**: [DOMAIN_NAMING_GUIDE.md](DOMAIN_NAMING_GUIDE.md) para padrões completos de nomenclatura de domínio.
```

### 4. ATUALIZAR REFERÊNCIAS CRUZADAS COM `DECISIONS.md`

**Localizações para atualizar**:

1. **Na seção "📚 DOCUMENTAÇÃO DE DECISÕES ARQUITETURAIS"**:
   - Expandir para explicar o propósito do ADR (Architectural Decisions Record)
   - Incluir referência direta ao `DECISIONS.md`

2. **Na seção "🗄️ PADRÃO CANÔNICO DO BANCO DE DADOS"**:
   - Referenciar `DECISIONS.md` para entender o racional por trás do padrão

---

## 📊 IMPACTO DAS ATUALIZAÇÕES

### ✅ BENEFÍCIOS:
1. **Clareza para desenvolvedores**: Sabem exatamente quais arquivos atualizar
2. **Consistência arquitetural**: Prevenção de erros ao criar novos módulos
3. **Documentação completa**: Todos os documentos referenciados corretamente
4. **Exemplo canônico**: `sales-order-sync` segue padrão "entidade específica + capacidade"

### 🔧 ESFORÇO ESTIMADO:
- **Adições**: ~500-700 palavras (nova seção + atualizações)
- **Revisões**: Atualizar 3-5 seções existentes
- **Consistência**: Garantir que todas as referências estejam atualizadas

---

## 🚀 PRÓXIMOS PASSOS

1. **Abrir o `PROJECT_MANUAL.docx`** no Microsoft Word
2. **Adicionar nova seção** "📄 ARQUIVOS OBRIGATÓRIOS PARA ATUALIZAÇÃO"
3. **Atualizar referências** ao `DOMAIN_NAMING_GUIDE.md`
4. **Corrigir exemplo** `orders-sync` → `sales-order-sync`
5. **Revisar consistência** de todas as referências cruzadas
6. **Salvar e distribuir** versão atualizada

---

## 📞 SUPORTE

Para dúvidas sobre estas atualizações, consulte:
- `docs/DOMAIN_NAMING_GUIDE.md` - Padrões canônicos de nomenclatura
- `docs/DECISIONS.md` - Decisões arquiteturais fundamentais
- `apps/api/ROUTES.md` - Template para documentação de rotas

**Última atualização**: 2026-06-10
**Responsável**: Assistente AI (análise de documentação)
**Status**: ✅ Identificado / 🟡 Aguardando implementação