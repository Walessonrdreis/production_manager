curl -s https://app.omie.com.br/api/v1/geral/malha/ \
 -H 'Content-type: application/json' \
 -d '{"call":"ListarEstruturas","param":[{"nPagina":5,"nRegPorPagina":1}],"app_key":"#APP_KEY#","app_secret":"#APP_SECRET#"}'
Cabeçalho
Content-Type: application/json; encoding=UTF-8
Corpo
{
  "nPagina": 5,
  "nTotPaginas": 566,
  "nRegistros": 1,
  "nTotRegistros": 566,
  "produtosEncontrados": [
    {
      "custoProducao": {
        "vGGF": 0,
        "vMOD": 0
      },
      "ident": {
        "codFamilia": "bkg",
        "codProduto": "42avkg",
        "descrFamilia": "Barra 1kg",
        "descrProduto": "42% cacau ao leite de aveia 1 Kg",
        "idFamilia": 9366771335,
        "idProduto": 9116172021,
        "pesoBrutoProduto": 1,
        "pesoLiqProduto": 1,
        "tipoProduto": "04",
        "unidProduto": "KG"
      },
      "itens": [
        {
          "codFamMalha": "insumos",
          "codProdMalha": "i42ar",
          "dAltProdMalha": "04/12/2024",
          "dIncProdMalha": "02/08/2024",
          "descrFamMalha": "Insumos",
          "descrProdMalha": "i I 42% Aveia Refinado",
          "hAltProdMalha": "14:36:23",
          "hIncProdMalha": "10:53:35",
          "idFamMalha": 9116163575,
          "idMalha": 9209354337,
          "idProdMalha": 9207255994,
          "percPerdaProdMalha": 0,
          "pesoBrutoProdMalha": 1,
          "pesoLiqProdMalha": 1,
          "quantProdMalha": 1.01,
          "tipoProdMalha": "03",
          "uAltProdMalha": "P000823983",
          "uIncProdMalha": "P000823983",
          "unidProdMalha": "KG"
        },
        {
          "codFamMalha": "emba",
          "codProdMalha": "embkgmet",
          "dAltProdMalha": "22/07/2025",
          "dIncProdMalha": "22/07/2025",
          "descrFamMalha": "Embalagem",
          "descrProdMalha": "e Embalagem Barra 1KG METALIZADO 18x30x008",
          "hAltProdMalha": "11:38:24",
          "hIncProdMalha": "11:38:24",
          "idFamMalha": 9116164164,
          "idMalha": 9410001749,
          "idProdMalha": 9271239617,
          "percPerdaProdMalha": 0,
          "pesoBrutoProdMalha": 0,
          "pesoLiqProdMalha": 0,
          "quantProdMalha": 1,
          "tipoProdMalha": "99",
          "uAltProdMalha": "P000823983",
          "uIncProdMalha": "P000823983",
          "unidProdMalha": "UN"
        }
      ],
      "observacoes": {}
    }
  ]
}