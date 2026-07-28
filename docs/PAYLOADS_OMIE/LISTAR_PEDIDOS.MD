Requisição cURL:
curl -s https://app.omie.com.br/api/v1/produtos/pedido/ \
 -H 'Content-type: application/json' \
 -d '{"call":"ListarPedidos","param":[{"pagina":1,"registros_por_pagina":1,"apenas_importado_api":"N"}],"app_key":"#APP_KEY#","app_secret":"#APP_SECRET#"}'
Cabeçalho
Content-Type: application/json; encoding=UTF-8
Corpo
{
  "pagina": 1,
  "total_de_paginas": 3336,
  "registros": 1,
  "total_de_registros": 3336,
  "pedido_venda_produto": [
    {
      "cabecalho": {
        "bloqueado": "N",
        "codigo_cenario_impostos": "9114995573",
        "codigo_cliente": 9162565190,
        "codigo_empresa": 9084171408,
        "codigo_parcela": "Z17",
        "codigo_pedido": 9162568814,
        "codigo_pedido_integracao": "",
        "data_previsao": "13/03/2024",
        "enc_data": "",
        "enc_hora": "",
        "enc_motivo": "",
        "enc_user": "",
        "encerrado": "",
        "etapa": "60",
        "importado_api": "",
        "numero_pedido": "2",
        "origem_pedido": "ERP",
        "qtde_parcelas": 2,
        "quantidade_itens": 3
      },
      "departamentos": [],
      "det": [
        {
          "combustivel": {},
          "ide": {
            "codigo_item": 9162595977,
            "codigo_item_integracao": "",
            "simples_nacional": "N"
          },
          "imposto": {
            "cbs": {
              "aliquota_cbs": 0,
              "perc_dif_cbs": 0,
              "perc_red_cbs": 0,
              "valor_cbs": 0,
              "valor_dif_cbs": 0
            },
            "cofins_padrao": {
              "aliq_cofins": 0,
              "base_cofins": 0,
              "cod_sit_trib_cofins": "99",
              "qtde_unid_trib_cofins": 100,
              "tipo_calculo_cofins": "U",
              "valor_cofins": 0,
              "valor_unid_trib_cofins": 0
            },
            "cofins_st": {
              "aliq_cofins_st": 0,
              "base_cofins_st": 0,
              "cod_sit_trib_cofins_st": "99",
              "margem_cofins_st": 0,
              "qtde_unid_trib_cofins_st": 0,
              "tipo_calculo_cofins_st": "",
              "valor_cofins_st": 0,
              "valor_unid_trib_cofins_st": 0
            },
            "csll": {
              "aliq_csll": 0,
              "valor_csll": 0
            },
            "ibs": {
              "aliquota_ibs_mu": 0,
              "aliquota_ibs_uf": 0,
              "perc_dif_ibs_mu": 0,
              "perc_dif_ibs_uf": 0,
              "perc_red_ibs_mu": 0,
              "perc_red_ibs_uf": 0,
              "valor_dif_ibs_mu": 0,
              "valor_dif_ibs_uf": 0,
              "valor_ibs": 0,
              "valor_ibs_mu": 0,
              "valor_ibs_uf": 0
            },
            "ibs_cbs": {
              "base_ibs_cbs": 0,
              "class_trib": "",
              "cst_ibs_cbs": ""
            },
            "icms": {},
            "icms_efet": {},
            "icms_ie": {
              "aliq_icms_FCP": 0,
              "aliq_interestadual": 0,
              "aliq_interna_uf_destino": 0,
              "aliq_partilha_icms": 0,
              "base_icms_uf_destino": 0,
              "valor_fcp_icms_inter": 0,
              "valor_icms_uf_dest": 0,
              "valor_icms_uf_remet": 0
            },
            "icms_sn": {
              "aliq_icms_sn": 0,
              "base_icms_sn": 0,
              "cod_sit_trib_icms_sn": "102",
              "origem_icms_sn": "0",
              "valor_credito_icms_sn": 0,
              "valor_icms_sn": 0
            },
            "icms_st": {
              "aliq_icms_opprop": 0,
              "aliq_icms_st": 0,
              "base_icms_st": 0,
              "cest": "",
              "cod_sit_trib_icms_st": "",
              "margem_icms_st": 0,
              "modalidade_icms_st": "",
              "perc_red_base_icms_op": 0,
              "perc_red_base_icms_st": 0,
              "valor_icms_st": 0
            },
            "inss": {
              "aliq_inss": 0,
              "valor_inss": 0
            },
            "ipi": {
              "aliq_ipi": 0,
              "base_ipi": 0,
              "cod_sit_trib_ipi": "53",
              "enquadramento_ipi": "999",
              "qtde_unid_trib_ipi": 0,
              "tipo_calculo_ipi": "",
              "valor_ipi": 0,
              "valor_unid_trib_ipi": 0
            },
            "irrf": {
              "aliq_irrf": 0,
              "valor_irrf": 0
            },
            "iss": {
              "aliq_iss": 0,
              "base_iss": 0,
              "retem_iss": "",
              "valor_iss": 0
            },
            "pis_padrao": {
              "aliq_pis": 0,
              "base_pis": 0,
              "cod_sit_trib_pis": "99",
              "qtde_unid_trib_pis": 100,
              "tipo_calculo_pis": "U",
              "valor_pis": 0,
              "valor_unid_trib_pis": 0
            },
            "pis_st": {
              "aliq_pis_st": 0,
              "base_pis_st": 0,
              "cod_sit_trib_pis_st": "99",
              "margem_pis_st": 0,
              "qtde_unid_trib_pis_st": 0,
              "tipo_calculo_pis_st": "",
              "valor_pis_st": 0,
              "valor_unid_trib_pis_st": 0
            },
            "trib_reg": {
              "aliquota_reg_cbs": 0,
              "aliquota_reg_ibs_mu": 0,
              "aliquota_reg_ibs_uf": 0,
              "class_trib_reg": "",
              "cst_reg_ibs_cst": "",
              "valor_reg_cbs": 0,
              "valor_reg_ibs_mu": 0,
              "valor_reg_ibs_uf": 0
            }
          },
          "inf_adic": {
            "codigo_categoria_item": "1.01.03",
            "codigo_cenario_impostos_item": "9114995573",
            "codigo_local_estoque": 9084171539,
            "dados_adicionais_item": "",
            "item_pedido_compra": 0,
            "nao_gerar_financeiro": "N",
            "nao_movimentar_estoque": "N",
            "nao_somar_total": "N",
            "numero_pedido_compra": "",
            "peso_bruto": 0,
            "peso_liquido": 0
          },
          "observacao": {},
          "produto": {
            "cfop": "5.102",
            "cnpj_fabricante": "10.464.918/0001-45",
            "codigo": "cxp",
            "codigo_produto": 9116172320,
            "codigo_tabela_preco": 2,
            "descricao": "Caixa para Presente P",
            "ean": "",
            "indicador_escala": "",
            "motivo_icms_desonerado": "",
            "ncm": "4819.20.00",
            "percentual_desconto": 20,
            "quantidade": 100,
            "reservado": "N",
            "tipo_desconto": "P",
            "unidade": "UND",
            "valor_deducao": 0,
            "valor_desconto": 180,
            "valor_icms_desonerado": 0,
            "valor_mercadoria": 900,
            "valor_total": 720,
            "valor_unitario": 9
          },
          "rastreabilidade": {},
          "tributavel": {}
        },
        {
          "combustivel": {},
          "ide": {
            "codigo_item": 9162621707,
            "codigo_item_integracao": "",
            "simples_nacional": "N"
          },
          "imposto": {
            "cbs": {
              "aliquota_cbs": 0,
              "perc_dif_cbs": 0,
              "perc_red_cbs": 0,
              "valor_cbs": 0,
              "valor_dif_cbs": 0
            },
            "cofins_padrao": {
              "aliq_cofins": 0,
              "base_cofins": 0,
              "cod_sit_trib_cofins": "99",
              "qtde_unid_trib_cofins": 75,
              "tipo_calculo_cofins": "U",
              "valor_cofins": 0,
              "valor_unid_trib_cofins": 0
            },
            "cofins_st": {
              "aliq_cofins_st": 0,
              "base_cofins_st": 0,
              "cod_sit_trib_cofins_st": "99",
              "margem_cofins_st": 0,
              "qtde_unid_trib_cofins_st": 0,
              "tipo_calculo_cofins_st": "",
              "valor_cofins_st": 0,
              "valor_unid_trib_cofins_st": 0
            },
            "csll": {
              "aliq_csll": 0,
              "valor_csll": 0
            },
            "ibs": {
              "aliquota_ibs_mu": 0,
              "aliquota_ibs_uf": 0,
              "perc_dif_ibs_mu": 0,
              "perc_dif_ibs_uf": 0,
              "perc_red_ibs_mu": 0,
              "perc_red_ibs_uf": 0,
              "valor_dif_ibs_mu": 0,
              "valor_dif_ibs_uf": 0,
              "valor_ibs": 0,
              "valor_ibs_mu": 0,
              "valor_ibs_uf": 0
            },
            "ibs_cbs": {
              "base_ibs_cbs": 0,
              "class_trib": "",
              "cst_ibs_cbs": ""
            },
            "icms": {},
            "icms_efet": {},
            "icms_ie": {
              "aliq_icms_FCP": 0,
              "aliq_interestadual": 0,
              "aliq_interna_uf_destino": 0,
              "aliq_partilha_icms": 0,
              "base_icms_uf_destino": 0,
              "valor_fcp_icms_inter": 0,
              "valor_icms_uf_dest": 0,
              "valor_icms_uf_remet": 0
            },
            "icms_sn": {
              "aliq_icms_sn": 0,
              "base_icms_sn": 0,
              "cod_sit_trib_icms_sn": "102",
              "origem_icms_sn": "0",
              "valor_credito_icms_sn": 0,
              "valor_icms_sn": 0
            },
            "icms_st": {
              "aliq_icms_opprop": 0,
              "aliq_icms_st": 0,
              "base_icms_st": 0,
              "cest": "",
              "cod_sit_trib_icms_st": "",
              "margem_icms_st": 0,
              "modalidade_icms_st": "",
              "perc_red_base_icms_op": 0,
              "perc_red_base_icms_st": 0,
              "valor_icms_st": 0
            },
            "inss": {
              "aliq_inss": 0,
              "valor_inss": 0
            },
            "ipi": {
              "aliq_ipi": 0,
              "base_ipi": 0,
              "cod_sit_trib_ipi": "53",
              "enquadramento_ipi": "999",
              "qtde_unid_trib_ipi": 0,
              "tipo_calculo_ipi": "",
              "valor_ipi": 0,
              "valor_unid_trib_ipi": 0
            },
            "irrf": {
              "aliq_irrf": 0,
              "valor_irrf": 0
            },
            "iss": {
              "aliq_iss": 0,
              "base_iss": 0,
              "retem_iss": "",
              "valor_iss": 0
            },
            "pis_padrao": {
              "aliq_pis": 0,
              "base_pis": 0,
              "cod_sit_trib_pis": "99",
              "qtde_unid_trib_pis": 75,
              "tipo_calculo_pis": "U",
              "valor_pis": 0,
              "valor_unid_trib_pis": 0
            },
            "pis_st": {
              "aliq_pis_st": 0,
              "base_pis_st": 0,
              "cod_sit_trib_pis_st": "99",
              "margem_pis_st": 0,
              "qtde_unid_trib_pis_st": 0,
              "tipo_calculo_pis_st": "",
              "valor_pis_st": 0,
              "valor_unid_trib_pis_st": 0
            },
            "trib_reg": {
              "aliquota_reg_cbs": 0,
              "aliquota_reg_ibs_mu": 0,
              "aliquota_reg_ibs_uf": 0,
              "class_trib_reg": "",
              "cst_reg_ibs_cst": "",
              "valor_reg_cbs": 0,
              "valor_reg_ibs_mu": 0,
              "valor_reg_ibs_uf": 0
            }
          },
          "inf_adic": {
            "codigo_categoria_item": "1.01.03",
            "codigo_cenario_impostos_item": "9114995573",
            "codigo_local_estoque": 9084171539,
            "dados_adicionais_item": "",
            "item_pedido_compra": 0,
            "nao_gerar_financeiro": "N",
            "nao_movimentar_estoque": "N",
            "nao_somar_total": "N",
            "numero_pedido_compra": "",
            "peso_bruto": 0.095,
            "peso_liquido": 0
          },
          "observacao": {},
          "produto": {
            "cfop": "5.102",
            "cnpj_fabricante": "28.866.837/0001-37",
            "codigo": "42NS",
            "codigo_produto": 9116172172,
            "codigo_tabela_preco": 1,
            "descricao": "42% cacau - Nibs com flor de sal",
            "ean": "",
            "indicador_escala": "",
            "motivo_icms_desonerado": "",
            "ncm": "1806.31.20",
            "percentual_desconto": 20,
            "quantidade": 75,
            "reservado": "N",
            "tipo_desconto": "P",
            "unidade": "UND",
            "valor_deducao": 0,
            "valor_desconto": 390,
            "valor_icms_desonerado": 0,
            "valor_mercadoria": 1950,
            "valor_total": 1560,
            "valor_unitario": 26
          },
          "rastreabilidade": {},
          "tributavel": {}
        },
        {
          "combustivel": {},
          "ide": {
            "codigo_item": 9162621790,
            "codigo_item_integracao": "",
            "simples_nacional": "N"
          },
          "imposto": {
            "cbs": {
              "aliquota_cbs": 0,
              "perc_dif_cbs": 0,
              "perc_red_cbs": 0,
              "valor_cbs": 0,
              "valor_dif_cbs": 0
            },
            "cofins_padrao": {
              "aliq_cofins": 0,
              "base_cofins": 0,
              "cod_sit_trib_cofins": "99",
              "qtde_unid_trib_cofins": 25,
              "tipo_calculo_cofins": "U",
              "valor_cofins": 0,
              "valor_unid_trib_cofins": 0
            },
            "cofins_st": {
              "aliq_cofins_st": 0,
              "base_cofins_st": 0,
              "cod_sit_trib_cofins_st": "99",
              "margem_cofins_st": 0,
              "qtde_unid_trib_cofins_st": 0,
              "tipo_calculo_cofins_st": "",
              "valor_cofins_st": 0,
              "valor_unid_trib_cofins_st": 0
            },
            "csll": {
              "aliq_csll": 0,
              "valor_csll": 0
            },
            "ibs": {
              "aliquota_ibs_mu": 0,
              "aliquota_ibs_uf": 0,
              "perc_dif_ibs_mu": 0,
              "perc_dif_ibs_uf": 0,
              "perc_red_ibs_mu": 0,
              "perc_red_ibs_uf": 0,
              "valor_dif_ibs_mu": 0,
              "valor_dif_ibs_uf": 0,
              "valor_ibs": 0,
              "valor_ibs_mu": 0,
              "valor_ibs_uf": 0
            },
            "ibs_cbs": {
              "base_ibs_cbs": 0,
              "class_trib": "",
              "cst_ibs_cbs": ""
            },
            "icms": {},
            "icms_efet": {},
            "icms_ie": {
              "aliq_icms_FCP": 0,
              "aliq_interestadual": 0,
              "aliq_interna_uf_destino": 0,
              "aliq_partilha_icms": 0,
              "base_icms_uf_destino": 0,
              "valor_fcp_icms_inter": 0,
              "valor_icms_uf_dest": 0,
              "valor_icms_uf_remet": 0
            },
            "icms_sn": {
              "aliq_icms_sn": 0,
              "base_icms_sn": 0,
              "cod_sit_trib_icms_sn": "102",
              "origem_icms_sn": "0",
              "valor_credito_icms_sn": 0,
              "valor_icms_sn": 0
            },
            "icms_st": {
              "aliq_icms_opprop": 0,
              "aliq_icms_st": 0,
              "base_icms_st": 0,
              "cest": "",
              "cod_sit_trib_icms_st": "",
              "margem_icms_st": 0,
              "modalidade_icms_st": "",
              "perc_red_base_icms_op": 0,
              "perc_red_base_icms_st": 0,
              "valor_icms_st": 0
            },
            "inss": {
              "aliq_inss": 0,
              "valor_inss": 0
            },
            "ipi": {
              "aliq_ipi": 0,
              "base_ipi": 0,
              "cod_sit_trib_ipi": "53",
              "enquadramento_ipi": "999",
              "qtde_unid_trib_ipi": 0,
              "tipo_calculo_ipi": "",
              "valor_ipi": 0,
              "valor_unid_trib_ipi": 0
            },
            "irrf": {
              "aliq_irrf": 0,
              "valor_irrf": 0
            },
            "iss": {
              "aliq_iss": 0,
              "base_iss": 0,
              "retem_iss": "",
              "valor_iss": 0
            },
            "pis_padrao": {
              "aliq_pis": 0,
              "base_pis": 0,
              "cod_sit_trib_pis": "99",
              "qtde_unid_trib_pis": 25,
              "tipo_calculo_pis": "U",
              "valor_pis": 0,
              "valor_unid_trib_pis": 0
            },
            "pis_st": {
              "aliq_pis_st": 0,
              "base_pis_st": 0,
              "cod_sit_trib_pis_st": "99",
              "margem_pis_st": 0,
              "qtde_unid_trib_pis_st": 0,
              "tipo_calculo_pis_st": "",
              "valor_pis_st": 0,
              "valor_unid_trib_pis_st": 0
            },
            "trib_reg": {
              "aliquota_reg_cbs": 0,
              "aliquota_reg_ibs_mu": 0,
              "aliquota_reg_ibs_uf": 0,
              "class_trib_reg": "",
              "cst_reg_ibs_cst": "",
              "valor_reg_cbs": 0,
              "valor_reg_ibs_mu": 0,
              "valor_reg_ibs_uf": 0
            }
          },
          "inf_adic": {
            "codigo_categoria_item": "1.01.03",
            "codigo_cenario_impostos_item": "9114995573",
            "codigo_local_estoque": 9084171539,
            "dados_adicionais_item": "",
            "item_pedido_compra": 0,
            "nao_gerar_financeiro": "N",
            "nao_movimentar_estoque": "N",
            "nao_somar_total": "N",
            "numero_pedido_compra": "",
            "peso_bruto": 0.08,
            "peso_liquido": 0
          },
          "observacao": {},
          "produto": {
            "cfop": "5.102",
            "cnpj_fabricante": "28.866.837/0001-37",
            "codigo": "55lc",
            "codigo_produto": 9116172204,
            "codigo_tabela_preco": 1,
            "descricao": "55% Cacau - Ao Leite de Coco com Castanha de Caju 80g",
            "ean": "",
            "indicador_escala": "",
            "motivo_icms_desonerado": "",
            "ncm": "1806.31.20",
            "percentual_desconto": 20,
            "quantidade": 25,
            "reservado": "N",
            "tipo_desconto": "P",
            "unidade": "UND",
            "valor_deducao": 0,
            "valor_desconto": 130,
            "valor_icms_desonerado": 0,
            "valor_mercadoria": 650,
            "valor_total": 520,
            "valor_unitario": 26
          },
          "rastreabilidade": {},
          "tributavel": {}
        }
      ],
      "exportacao": {
        "nao_exportacao": "N"
      },
      "frete": {
        "codigo_rastreio": "",
        "codigo_tipo_entrega": 0,
        "codigo_transportadora": 0,
        "especie_volumes": "",
        "link_rastreio": "",
        "marca_volumes": "",
        "modalidade": "9",
        "numeracao_volumes": "",
        "numero_lacre": "",
        "outras_despesas": 0,
        "peso_bruto": 9.125,
        "peso_liquido": 0,
        "placa": "",
        "placa_estado": "",
        "previsao_entrega": "",
        "quantidade_volumes": 0,
        "registro_transportador": "",
        "valor_frete": 0,
        "valor_seguro": 0,
        "veiculo_proprio": "S"
      },
      "infoCadastro": {
        "autorizado": "S",
        "cImpAPI": "N",
        "cancelado": "S",
        "dAlt": "13/03/2024",
        "dCan": "13/03/2024",
        "dFat": "13/03/2024",
        "dInc": "13/03/2024",
        "denegado": "N",
        "devolvido": "N",
        "devolvido_parcial": "N",
        "faturado": "S",
        "hAlt": "12:09:53",
        "hCan": "13:12:38",
        "hFat": "12:09:53",
        "hInc": "11:34:58",
        "uAlt": "P000679624",
        "uCan": "P000679624",
        "uFat": "P000679624",
        "uInc": "P000679624"
      },
      "informacoes_adicionais": {
        "codProj": 0,
        "codVend": 9162623954,
        "codigo_categoria": "1.01.03",
        "codigo_conta_corrente": 9114502812,
        "consumidor_final": "N",
        "contato": "Érika Souza",
        "dados_adicionais_nf": "",
        "enviar_email": "N",
        "enviar_pix": "N",
        "numero_contrato": "",
        "numero_pedido_cliente": "",
        "outros_detalhes": {},
        "utilizar_emails": "labarrchocolate314@gmail.com"
      },
      "lista_parcelas": {
        "parcela": [
          {
            "data_vencimento": "15/03/2024",
            "meio_pagamento": "15",
            "numero_parcela": 1,
            "percentual": 50,
            "quantidade_dias": 2,
            "tipo_documento": "BOL",
            "valor": 1400
          },
          {
            "data_vencimento": "28/03/2024",
            "numero_parcela": 2,
            "percentual": 50,
            "quantidade_dias": 15,
            "valor": 1400
          }
        ]
      },
      "observacoes": {
        "obs_venda": ""
      },
      "total_pedido": {
        "base_calculo_icms": 0,
        "base_calculo_st": 0,
        "base_ibs_cbs": 0,
        "valor_IPI": 0,
        "valor_cbs": 0,
        "valor_cofins": 0,
        "valor_csll": 0,
        "valor_deducoes": 0,
        "valor_descontos": 700,
        "valor_dif_cbs": 0,
        "valor_dif_ibs_mu": 0,
        "valor_dif_ibs_uf": 0,
        "valor_ibs": 0,
        "valor_ibs_mu": 0,
        "valor_ibs_uf": 0,
        "valor_icms": 0,
        "valor_inss": 0,
        "valor_ir": 0,
        "valor_iss": 0,
        "valor_mercadorias": 3500,
        "valor_pis": 0,
        "valor_st": 0,
        "valor_tot_ibs_cbs_is": 0,
        "valor_total_pedido": 2800
      }
    }
  ]
}