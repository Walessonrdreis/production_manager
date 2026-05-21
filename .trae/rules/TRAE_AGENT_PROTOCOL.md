---
alwaysApply: true
scene: development
---
# 🚨 TRAE AGENT PROTOCOL — EXECUÇÃO CONTROLADA

## 🔥 REGRA MÁXIMA

O agente NÃO é autônomo.

O agente executa EXATAMENTE o que foi pedido.

Se não está explicitamente descrito → NÃO FAZER.

---

# 🧠 REGRA 1 — UM STEP POR VEZ

- Execute apenas UM STEP
- NÃO antecipar próximos passos
- NÃO combinar múltiplas fases

❌ PROIBIDO:
- “já implementar o próximo”
- “aproveitar para adiantar”

✅ Regra:
> STEP atual é o único permitido

---

# 🛑 REGRA 2 — PARADA OBRIGATÓRIA

Após finalizar o STEP:

- PARAR IMEDIATAMENTE
- NÃO continuar
- NÃO sugerir implementação adicional

✅ Resposta final DEVE conter:

"Aguardando aprovação para próximo STEP"

# ❌ REGRA 3 — PROIBIÇÕES EXPLÍCITAS

Sempre respeitar:

Se estiver listado como proibido:

❌ NÃO FAZER

## PROIBIDO GLOBAL (sempre)

❌ Criar endpoints extras  
❌ Integrar com Omie sem autorização  
❌ Alterar código existente  
❌ Refatorar fora do escopo  
❌ Criar novas abstrações  
❌ Rodar migrations  
❌ Escrever fora do passo  


# ⚠️ REGRA 4 — NÃO ASSUMIR NADA

Se não estiver claro:

- NÃO assumir
- NÃO inventar
- NÃO inferir

✅ Ação correta:
> PARAR e perguntar

# 🧩 REGRA 5 — ALTERAÇÃO ISOLADA

- Alterar apenas o necessário
- Não tocar em outros módulos
- Não reorganizar estrutura

# 🧠 REGRA 6 — SEM OTIMIZAÇÃO

❌ NÃO melhorar código
❌ NÃO refatorar
❌ NÃO criar abstração

✅ Apenas:
> executar exatamente o pedido

# 🔄 REGRA 7 — CONTEXTO DE MIGRAÇÃO

Durante migração:

✅ manter compatibilidade
✅ manter legado
✅ manter funcionamento

❌ PROIBIDO:
- quebrar endpoints
- remover tabelas
- alterar comportamento


# 🔐 REGRA 8 — SEGURANÇA DO BANCO

❌ NUNCA:
- rodar prisma migrate
- alterar schema
- criar tabela nova


# 🧭 REGRA 9 — INTEGRAÇÃO

✅ API 1 = integração  
✅ API 2 = domínio  

❌ PROIBIDO:
- API 2 chamar externo
- escrever direto no core


# 📤 REGRA 10 — RESPOSTA PADRÃO

Sempre incluir:

- ✅ o que foi feito
- ✅ o que NÃO foi feito
- ✅ confirmação de regras respeitadas
- ✅ confirmação de parada

# 🛑 REGRA FINAL

Se houver dúvida:

> PARAR

Melhor parar incompleto  
do que executar além do permitido
