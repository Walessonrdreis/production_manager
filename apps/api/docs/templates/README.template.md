# Production Manager API

API do **Production Manager**: serviço backend para planejamento de produção, com integração ao ERP **Omie**.

**Produção:** {{PROD_URL}}

---

## 📌 Contrato público

- Endpoint base: `GET /v1/products`
- Chave externa: `omieCode`
- Retorna: produto + estoque atual
- Não chama Omie em tempo real

📄 Documentação:
- `docs/API_CONTRACT.md`
- `docs/REPO_STATUS.md`

---

## Tecnologias

{{TECH_STACK}}

---

## Como Rodar

### Pré-requisitos
{{PREREQS}}

### Variáveis de Ambiente

Obrigatórias:
{{ENV_REQUIRED}}

Opcionais:
{{ENV_OPTIONAL}}

---

## Scripts principais

{{SCRIPTS}}

---

## Arquitetura (Visão Geral)

{{ARCH_OVERVIEW}}

---

## Rotas principais

{{ROUTES}}

---

## Observações

- Endpoints públicos nunca chamam Omie
- Estoque vem de cache (`ProductStock`)
- README gerado automaticamente
``