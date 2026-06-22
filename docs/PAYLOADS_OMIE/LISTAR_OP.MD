 curl -s https://app.omie.com.br/api/v1/produtos/op/ \
 -H 'Content-type: application/json' \
 -d '{"call":"ListarOrdemProducao","param":[{"pagina":1,"registros_por_pagina":100,"dDtConclusaoDe":"22/06/2024","dDtConclusaoAte":"22/06/2026"}],"app_key":"#APP_KEY#","app_secret":"#APP_SECRET#"}'
 
Cabeçalho
Content-Type: application/json; encoding=UTF-8

Corpo

{
  "pagina": 1,
  "total_de_paginas": 15,
  "registros": 100,
  "total_de_registros": 1445,
  "cadastros": [
    {
      "identificacao": {
        "cCodIntOP": "",
        "cNumOP": "2024/00002",
        "codigo_local_estoque": 9084171539,
        "dDtPrevisao": "08/07/2024",
        "nCodOP": 9204166587,
        "nCodProduto": 9116172062,
        "nQtde": 132
      },
      "infAdicionais": {
        "cEtapa": "80",
        "dDtConclusao": "08/07/2024",
        "dDtInicio": "08/07/2024",
        "nCodProjeto": 0
      },
      "observacoes": {
        "cObs": ""
      },
      "outrasInf": {
        "cConcluida": "S",
        "dAlteracao": "08/07/2024",
        "dConclusao": "08/07/2024",
        "dInclusao": "08/07/2024",
        "hAlteracao": "16:57:50",
        "hConclusao": "16:57:50",
        "hInclusao": "16:25:05",
        "uAlt": "P000823983",
        "uInc": "P000823983"
      }
    },
 
 
 {
      "identificacao": {
        "cCodIntOP": "",
        "cNumOP": "2025/01535",
        "codigo_local_estoque": 9169896468,
        "dDtPrevisao": "14/10/2025",
        "nCodOP": 9453409713,
        "nCodProduto": 9116172165,
        "nQtde": 59
      },
      "infAdicionais": {
        "cEtapa": "40",
        "dDtConclusao": "14/10/2025",
        "dDtInicio": "14/10/2025",
        "nCodProjeto": 0
      },
      "observacoes": {
        "cObs": ""
      },
      "outrasInf": {
        "cConcluida": "N",
        "dAlteracao": "20/10/2025",
        "dConclusao": "20/10/2025",
        "dInclusao": "20/10/2025",
        "hAlteracao": "09:22:35",
        "hConclusao": "09:22:35",
        "hInclusao": "09:21:43",
        "uAlt": "P000823983",
        "uInc": "P000823983"
      }
    },
     {
      "identificacao": {
        "cCodIntOP": "",
        "cNumOP": "2025/01536",
        "codigo_local_estoque": 9169896468,
        "dDtPrevisao": "14/10/2025",
        "nCodOP": 9453410073,
        "nCodProduto": 9201860284,
        "nQtde": 109
      },
      "infAdicionais": {
        "cEtapa": "60",
        "dDtConclusao": "14/10/2025",
        "dDtInicio": "14/10/2025",
        "nCodProjeto": 0
      },
      "observacoes": {
        "cObs": ""
      },
      "outrasInf": {
        "cConcluida": "S",
        "dAlteracao": "20/10/2025",
        "dConclusao": "20/10/2025",
        "dInclusao": "20/10/2025",
        "hAlteracao": "09:24:50",
        "hConclusao": "09:24:50",
        "hInclusao": "09:22:48",
        "uAlt": "P000823983",
        "uInc": "P000823983"
      }
    },
  ]

}