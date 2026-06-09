# 🗺️ Mapa do Tesouro — Documentação Production Manager

Este README é seu **guia de navegação oficial** para a documentação do projeto Production Manager. Use-o para encontrar rapidamente o que precisa, na ordem certa.

## 🎯 Comece Aqui (Ordem de Leitura Recomendada)

Para **qualquer pessoa ou agente AI** que precise entender o projeto, siga esta ordem:

1. **🔴 [PROJECT_MANUAL.md](PROJECT_MANUAL.md)** — **AUTORIDADE MÁXIMA**
   - **Quando usar**: Sempre comece aqui. É a fonte de verdade principal do projeto.
   - **O que contém**: Visão geral, arquitetura, padrões fundamentais, referência canônica.
   - **Por que primeiro**: Todos os outros documentos detalham aspectos específicos e **não devem contradizê‑lo**.

2. **📋 [PROJECT_VISION.md](PROJECT_VISION.md)** — Visão Estratégica
   - **Quando usar**: Para entender o "porquê" do projeto, regras de ouro e decisões arquiteturais.
   - **O que contém**: Visão estratégica, regras de ouro, anti‑corruption layer, eventual consistency.

3. **🏗️ [ARCHITECTURE_GUIDE.md](ARCHITECTURE_GUIDE.md)** — Arquitetura Técnica
   - **Quando usar**: Para entender a estrutura canônica, fake/real, jobs, rotas e bootstrap.
   - **O que contém**: Estrutura de módulos, gateways, jobs, rotas, padrões de implementação.

## 🔧 Documentos Específicos (Use Conforme Necessidade)

| Documento | Quando Usar | O que Resolve |
|-----------|-------------|---------------|
| **📦 [MODULE_TEMPLATE.md](MODULE_TEMPLATE.md)** | Para **criar novos módulos** ou atualizar existentes | Template completo com ports, use case, store, gateways, jobs, routes, register |
| **📚 [IMPORTS_LIBRARY.md](IMPORTS_LIBRARY.md)** | Para **resolver erros de importação** ou entender padrões | Diferenciação crítica `@/infra/db` vs `@/shared/db/prisma`, ordem de imports, erros comuns |
| **📝 [NAMING_CONVENTIONS.md](NAMING_CONVENTIONS.md)** | Para **padronizar nomes** de arquivos, funções, variáveis | kebab‑case, padrões de arquivos, palavras‑chave, exceções (acrônimos) |
| **👨‍💻 [HOW_TO_CONTRIBUTE.md](HOW_TO_CONTRIBUTE.md)** | Para **desenvolvedores** que vão trabalhar no projeto | Guia prático de setup, desenvolvimento, testes, deploy |

## 🚀 Guia Rápido por Cenário

### "Preciso entender o projeto"
1. Leia `PROJECT_MANUAL.md` (autoridade máxima)
2. Leia `PROJECT_VISION.md` (visão estratégica)
3. Leia `ARCHITECTURE_GUIDE.md` (arquitetura técnica)

### "Preciso criar um novo módulo"
1. Leia `MODULE_TEMPLATE.md` (template completo)
2. Consulte `NAMING_CONVENTIONS.md` (padrões de nomes)
3. Consulte `IMPORTS_LIBRARY.md` (imports corretos)

### "Preciso resolver um erro de importação"
1. Leia `IMPORTS_LIBRARY.md` (diferenciação crítica)
2. Verifique se está usando `@/shared/db/prisma` (não `@/infra/db`)

### "Preciso seguir padrões do projeto"
1. Leia `NAMING_CONVENTIONS.md` (kebab‑case, etc.)
2. Consulte `ARCHITECTURE_GUIDE.md` (estrutura canônica)

## ⚠️ Regras de Ouro da Documentação

1. **Autoridade máxima**: `PROJECT_MANUAL.md` é a fonte de verdade principal.
2. **Sem contradições**: Nenhum documento deve contradizer o manual principal.
3. **Complementaridade**: Cada documento foca em um aspecto específico.
4. **Clareza para IA**: Documentação escrita para ser entendida por humanos e agentes AI.

## 📁 Estrutura da Pasta `docs/`

```
docs/
├── README.md                 ← Você está aqui (mapa do tesouro)
├── PROJECT_MANUAL.md         ← Autoridade máxima (comece aqui)
├── PROJECT_VISION.md         ← Visão estratégica
├── ARCHITECTURE_GUIDE.md     ← Arquitetura técnica
├── MODULE_TEMPLATE.md        ← Template para novos módulos
├── IMPORTS_LIBRARY.md        ← Biblioteca de imports padrão
├── NAMING_CONVENTIONS.md     ← Padrões de nomenclatura
└── HOW_TO_CONTRIBUTE.md      ← Guia para desenvolvedores
```

## 🔄 Atualizações

- **Última revisão**: 2026‑06‑09
- **Status**: Documentação alinhada com código em produção
- **Próximos passos**: Ajustes finos de env e injeção de dependências

---

**Dica para agentes AI**: Sempre comece pelo `PROJECT_MANUAL.md`. Se precisar de detalhes específicos, consulte o documento correspondente na tabela acima.