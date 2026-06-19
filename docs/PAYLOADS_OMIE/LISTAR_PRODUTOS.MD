Requisição cURL:
curl -s https://app.omie.com.br/api/v1/geral/produtos/ \
 -H 'Content-type: application/json' \
 -d '{"call":"ListarProdutos","param":[{"pagina":5,"registros_por_pagina":1,"apenas_importado_api":"N","filtrar_apenas_omiepdv":"N"}],"app_key":"#APP_KEY#","app_secret":"#APP_SECRET#"}'
Cabeçalho
Content-Type: application/json; encoding=UTF-8
Corpo
{
  "pagina": 5,
  "total_de_paginas": 1769,
  "registros": 1,
  "total_de_registros": 1769,
  "produto_servico_cadastro": [
    {
      "aliquota_cbs": 0,
      "aliquota_cofins": 0,
      "aliquota_ibpt": 0,
      "aliquota_ibs_mun": 0,
      "aliquota_ibs_uf": 0,
      "aliquota_icms": 0,
      "aliquota_pis": 0,
      "altura": 0,
      "bloqueado": "N",
      "bloquear_exclusao": "N",
      "cest": "",
      "cfop": "",
      "class_trib": "",
      "codInt_familia": "",
      "codigo": "42avkg",
      "codigo_beneficio": "",
      "codigo_familia": 9366771335,
      "codigo_produto": 9116172021,
      "codigo_produto_integracao": "",
      "csosn_icms": "",
      "cst_cofins": "",
      "cst_ibs_cbs": "",
      "cst_icms": "",
      "cst_pis": "",
      "descr_detalhada": "",
      "descricao": "42% cacau ao leite de aveia 1 Kg",
      "descricao_familia": "Barra 1kg",
      "dias_crossdocking": 0,
      "dias_garantia": 0,
      "ean": "",
      "estoque_minimo": 0,
      "exibir_descricao_nfe": "N",
      "exibir_descricao_pedido": "N",
      "imagens": [
        {
          "url_imagem": "https://cdn.omie.com.br/repository/be2acdaab42966c1d761e822e7c87107/61e3bebd207a53908aa738c5d3a150d2/omie___img-20240819-wa0004__conv.jpg?marker=TO_SIGN"
        }
      ],
      "importado_api": "N",
      "inativo": "N",
      "info": {
        "dAlt": "22/01/2026",
        "dInc": "28/11/2023",
        "hAlt": "14:38:26",
        "hInc": "18:10:54",
        "uAlt": "P000848229",
        "uInc": "P000679624"
      },
      "largura": 0,
      "lead_time": 0,
      "marca": "Labarr Chocolate de Origem",
      "modelo": "",
      "motivo_deson_icms": "",
      "ncm": "1806.32.10",
      "obs_internas": "",
      "per_icms_fcp": 0,
      "perc_reducao_cbs": 0,
      "perc_reducao_ibs_mun": 0,
      "perc_reducao_ibs_uf": 0,
      "peso_bruto": 1,
      "peso_liq": 1,
      "produto_lote": "N",
      "produto_variacao": "N",
      "profundidade": 0,
      "quantidade_estoque": 0,
      "recomendacoes_fiscais": {
        "cnpj_fabricante": "28.866.837/0001-37",
        "cupom_fiscal": "S",
        "id_cest": "",
        "id_preco_tabelado": 0,
        "indicador_escala": "",
        "market_place": "S",
        "origem_mercadoria": "0"
      },
      "red_base_cofins": 0,
      "red_base_icms": 0,
      "red_base_pis": 0,
      "tipoItem": "04",
      "unidade": "KG",
      "valor_unitario": 195
    }
  ]
}
