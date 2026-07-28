# REGRAS DE TRABALHO INCREMENTAL - TODAS AS FASES

## 🚫 REGRA CRÍTICA: AÇÕES CURTAS E INCREMENTAIS
**NÃO FAÇA TUDO DE UMA VEZ!** Siga estas regras rigorosamente:

### 1. **MÁXIMO POR AÇÃO**
- **Arquivos**: Máximo 3 arquivos criados/modificados por ação
- **Tempo**: Máximo 15 minutos por ação
- **Tarefas**: Apenas UMA funcionalidade específica por ação

### 2. **FLUXO PADRÃO POR AÇÃO**
```
1. Planejar → 2. Implementar → 3. Testar → 4. Mostrar → 5. Perguntar
```

### 3. **EXEMPLOS CONCRETOS**
**✅ CORRETO (1 ação):**
- Criar `IntelligentPollingService.ts` (estrutura básica)
- Escrever testes unitários para estrutura
- Mostrar arquivo criado e testes

**❌ ERRADO (múltiplas ações juntas):**
- Criar service + modificar jobs + configurar Redis + testar tudo

### 4. **METAS POR AÇÃO**
- **Ideal**: 1-2 arquivos, 1 funcionalidade, 5-15 minutos
- **Aceitável**: 3 arquivos, 1 funcionalidade, até 15 minutos
- **Proibido**: >3 arquivos, >1 funcionalidade, >15 minutos

### 5. **SINAIS DE ALERTA**
Se você perceber que:
- Está modificando muitos arquivos → PARE e divida
- A ação está demorando muito → PARE e divida
- Está implementando múltiplas features → PARE e divida

### 6. **BENEFÍCIOS**
- **Economia de créditos**: Ações curtas usam menos créditos
- **Revisão fácil**: Progresso visível passo a passo
- **Controle total**: Usuário pode parar a qualquer momento
- **Menos erros**: Problemas são identificados rapidamente

## 📋 CHECKLIST OBRIGATÓRIO APÓS CADA AÇÃO
- [ ] Mostrei quais arquivos foram criados/modificados?
- [ ] Mostrei testes executados e resultados?
- [ ] Verifiquei logs do sistema?
- [ ] Corrigi erros imediatamente?
- [ ] A ação levou menos de 15 minutos?
- [ ] Modifiquei no máximo 3 arquivos?
- [ ] Implementei apenas UMA funcionalidade?
- [ ] Perguntei se devo continuar?

## 🔗 REFERÊNCIAS
- [Regras de Trabalho Incremental](file:///C:/Users/walll/OneDrive/projects_git/production_manager/.trae/rules/trabalho-incremental.md)
- [Regras de Respostas](file:///C:/Users/walll/OneDrive/projects_git/production_manager/.trae/rules/regras-de-respostas.md)

---

**LEMBRE-SE**: O usuário prefere ver progresso passo a passo do que uma implementação completa de uma vez. Isso economiza créditos e facilita a revisão!