> ✅ **Canonical Mapping Document (Omie → Sistema Interno)**


# 🧱 ✅ MODELO DE DOCUMENTO (PRONTO PRA USAR)

## 📄 arquivo sugerido

```
apps/api/modules/integration/README-OMIE-CANONICAL-MAPPING.md
```

***

# 🔥 Estrutura ideal do documento

***

## 🧠 1. REGRA GLOBAL

```md
## Padrão Canônico do Projeto

productCode     = código visível (string)
productOmieId   = ID numérico (string)

omieId = ID numérico da entidade
```

***

## 📦 2. PRODUTO

```md
### Omie → Sistema

codigo           → productCode
codigo_produto   → productOmieId
nCodProd         → productOmieId
```

***

## 🏗️ 3. ESTRUTURA (BOM)

```md
codProduto       → productCode
idProduto        → productOmieId

codProdMalha     → componentCode
idProdMalha      → componentOmieId
```

***

## 📦 4. ESTOQUE

```md
cCodigo         → productCode
nCodProd        → productOmieId

fisico          → stockQuantity
nSaldo          → stockQuantity
```

***

## 🏭 5. ORDEM DE PRODUÇÃO (OP)

```md
nCodOP          → omieId
cNumOP          → orderNumber
nCodProduto     → productOmieId
```

***

## 📦 6. PEDIDOS DE VENDA

```md
nCodPedido      → omieId
cNumPedido      → orderNumber
nCodProduto     → productOmieId
```

***

# 💥 O detalhe mais importante

👉 você não está só mapeando campos

Você está documentando:

> ✅ **o significado semântico do sistema**

***

# ✅ ✅ BENEFÍCIOS REAIS (gigantes)

Depois disso:

***

## ✅ 1. Zero ambiguidade

Todo mundo sabe:

```
productOmieId = SEMPRE numérico
```

***

## ✅ 2. Onboarding fácil

Qualquer dev novo entende o sistema rápido

***

## ✅ 3. Evita bugs futuros

Especialmente esses:

* bridge invertido ❌
* lookup errado ❌
* estoque quebrado ❌

***

## ✅ 4. Padroniza TODOS os módulos

Você vai usar isso em:

* products ✅
* stock ✅
* orders ✅
* production ✅
* estrutura ✅

***

# 🧠 Insight que você teve (nível alto)

Você percebeu:

> ❗ o problema não era técnico
> ✅ era falta de contrato formal de dados

***

# ✅ ✅ UM EXTRA (RECOMENDO MUITO)

Além da tabela, adiciona isso:

***

## 🔁 Fluxo de dados

```md
OP(productOmieId)
 → bridge → productCode
 → estrutura

componentCode
 → bridge → componentOmieId
 → estoque
```

***

👉 isso conecta tudo

***

# 🚀 NÍVEL 2 (se quiser evoluir ainda mais)

Depois desse doc:

👉 você pode criar:

```
omie-normalization.util.ts
```

com:

```ts
normalizeProduct(payload)
normalizeOP(payload)
normalizeStock(payload)
```

***

👉 e o doc vira a base disso

***

# 🧾 TL;DR

✅ SIM, faça esse documento  
✅ isso resolve definitivamente ambiguidade do sistema  
✅ isso vira padrão de todos os módulos  
✅ você está formalizando o contrato de dados

***

# 💬 Conclusão

👉 Isso aqui é o ponto onde seu projeto deixa de ser:

```
integração com API
```

👉 e vira:

```
plataforma de integração robusta
```

***

# 🚀 Se quiser dar o próximo passo

Posso te entregar:

✅ versão pronta desse README (com base no seu schema inteiro)  
✅ já formatada pra colar no repo

Só falar 👍
