// Teste da lógica de extração de código do cliente

function tryBigInt(value) {
  try {
    if (value === null || value === undefined) return null;

    if (typeof value === "bigint") return value;

    if (typeof value === "number") {
      if (!Number.isFinite(value)) return null;
      return BigInt(value);
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      return BigInt(trimmed);
    }

    return null;
  } catch {
    return null;
  }
}

function extractOmieClientCode(order) {
  // ✅ FORMATO A — payload Omie cru
  const fromHeader = order?.cabecalho?.codigo_cliente;
  const parsedFromHeader = tryBigInt(fromHeader);
  if (parsedFromHeader) return parsedFromHeader;

  // ✅ FORMATO B — payload normalizado (camelCase)
  const camel =
    order?.codigoCliente ??
    order?.codigoClienteOmie ??
    order?.omieClientCode;

  const parsedCamel = tryBigInt(camel);
  if (parsedCamel) return parsedCamel;

  // ✅ FORMATO C — payload snake_case (defensivo)
  const snake =
    order?.codigo_cliente ??
    order?.codigo_cliente_omie;

  const parsedSnake = tryBigInt(snake);
  if (parsedSnake) return parsedSnake;

  return null;
}

// Simular o JSON exato do pedido
const orderJson = {
  "id": "83443280-afa9-45a1-b9c5-655cbfd021db",
  "omieCode": "9542202219",
  "numeroPedido": "3061",
  "codigoCliente": "9542198176",  // ← Este é o campo que temos
  "codigoEmpresa": "9084171408",
  "etapa": "20",
  "cancelado": "N",
  "encerrado": "N",
  "dataPrevisao": "2026-05-15T00:00:00.000Z",
  "rawPayload": {
    "det": [
      {
        "ide": {
          "codigo_item": 9542202220,
          "simples_nacional": "N",
          "codigo_item_integracao": "1454511585"
        },
        "imposto": {
          "cbs": {
            "valor_cbs": 0,
            "aliquota_cbs": 0,
            "perc_dif_cbs": 0,
            "perc_red_cbs": 0,
            "valor_dif_cbs": 0
          },
          "ibs": {
            "valor_ibs": 0,
            "valor_ibs_mu": 0,
            "valor_ibs_uf": 0,
            "aliquota_ibs_mu": 0,
            "aliquota_ibs_uf": 0,
            "perc_dif_ibs_mu": 0,
            "perc_dif_ibs_uf": 0,
            "perc_red_ibs_mu": 0,
            "perc_red_ibs_uf": 0,
            "valor_dif_ibs_mu": 0,
            "valor_dif_ibs_uf": 0
          },
          "ipi": {
            "aliq_ipi": 0,
            "base_ipi": 0,
            "valor_ipi": 0,
            "cod_sit_trib_ipi": "53",
            "tipo_calculo_ipi": "",
            "enquadramento_ipi": "999",
            "qtde_unid_trib_ipi": 0,
            "valor_unid_trib_ipi": 0
          },
          "iss": {
            "aliq_iss": 0,
            "base_iss": 0,
            "retem_iss": "",
            "valor_iss": 0
          },
          "csll": {
            "aliq_csll": 0,
            "valor_csll": 0
          },
          "icms": {},
          "inss": {
            "aliq_inss": 0,
            "valor_inss": 0
          },
          "irrf": {
            "aliq_irrf": 0,
            "valor_irrf": 0
          },
          "pis_st": {
            "aliq_pis_st": 0,
            "base_pis_st": 0,
            "valor_pis_st": 0,
            "margem_pis_st": 0,
            "cod_sit_trib_pis_st": "99",
            "tipo_calculo_pis_st": "",
            "qtde_unid_trib_pis_st": 0,
            "valor_unid_trib_pis_st": 0
          },
          "ibs_cbs": {
            "class_trib": "",
            "cst_ibs_cbs": "",
            "base_ibs_cbs": 0
          },
          "icms_ie": {
            "aliq_icms_FCP": 0,
            "aliq_interestadual": 0,
            "aliq_partilha_icms": 0,
            "valor_icms_uf_dest": 0,
            "valor_icms_uf_remet": 0,
            "base_icms_uf_destino": 0,
            "valor_fcp_icms_inter": 0,
            "aliq_interna_uf_destino": 0
          },
          "icms_sn": {},
          "icms_st": {
            "cest": "",
            "aliq_icms_st": 0,
            "base_icms_st": 0,
            "valor_icms_st": 0,
            "margem_icms_st": 0,
            "aliq_icms_opprop": 0,
            "modalidade_icms_st": "",
            "cod_sit_trib_icms_st": "",
            "perc_red_base_icms_op": 0,
            "perc_red_base_icms_st": 0
          },
          "trib_reg": {
            "valor_reg_cbs": 0,
            "class_trib_reg": "",
            "cst_reg_ibs_cst": "",
            "aliquota_reg_cbs": 0,
            "valor_reg_ibs_mu": 0,
            "valor_reg_ibs_uf": 0,
            "aliquota_reg_ibs_mu": 0,
            "aliquota_reg_ibs_uf": 0
          },
          "cofins_st": {
            "aliq_cofins_st": 0,
            "base_cofins_st": 0,
            "valor_cofins_st": 0,
            "margem_cofins_st": 0,
            "cod_sit_trib_cofins_st": "99",
            "tipo_calculo_cofins_st": "",
            "qtde_unid_trib_cofins_st": 0,
            "valor_unid_trib_cofins_st": 0
          },
          "icms_efet": {},
          "pis_padrao": {
            "aliq_pis": 0,
            "base_pis": 0,
            "valor_pis": 0,
            "cod_sit_trib_pis": "99",
            "tipo_calculo_pis": "U",
            "qtde_unid_trib_pis": 1,
            "valor_unid_trib_pis": 0
          },
          "cofins_padrao": {
            "aliq_cofins": 0,
            "base_cofins": 0,
            "valor_cofins": 0,
            "cod_sit_trib_cofins": "99",
            "tipo_calculo_cofins": "B",
            "qtde_unid_trib_cofins": 0,
            "valor_unid_trib_cofins": 0
          }
        },
        "produto": {
          "ean": "",
          "ncm": "1806.32.10",
          "cfop": "",
          "codigo": "70tkg",
          "unidade": "KG",
          "descricao": "70% cacau Tâmaras 1 kg",
          "reservado": "N",
          "quantidade": 1,
          "valor_total": 210,
          "tipo_desconto": "P",
          "valor_deducao": 0,
          "codigo_produto": 9434332818,
          "valor_desconto": 0,
          "valor_unitario": 210,
          "cnpj_fabricante": "",
          "indicador_escala": "",
          "valor_mercadoria": 210,
          "codigo_tabela_preco": 2,
          "percentual_desconto": 0,
          "valor_icms_desonerado": 0,
          "motivo_icms_desonerado": ""
        },
        "inf_adic": {
          "peso_bruto": 1,
          "peso_liquido": 1,
          "nao_somar_total": "N",
          "item_pedido_compra": 0,
          "codigo_local_estoque": 9169896468,
          "nao_gerar_financeiro": "N",
          "numero_pedido_compra": "",
          "codigo_categoria_item": "1.01.99",
          "dados_adicionais_item": "",
          "nao_movimentar_estoque": "N",
          "codigo_cenario_impostos_item": "9114995573"
        },
        "observacao": {},
        "tributavel": {},
        "combustivel": {},
        "rastreabilidade": {}
      }
    ],
    "frete": {
      "placa": "",
      "modalidade": "9",
      "peso_bruto": 1,
      "valor_frete": 0,
      "numero_lacre": "",
      "peso_liquido": 1,
      "placa_estado": "",
      "valor_seguro": 0,
      "link_rastreio": "",
      "marca_volumes": "",
      "codigo_rastreio": "",
      "especie_volumes": "",
      "outras_despesas": 0,
      "veiculo_proprio": "",
      "previsao_entrega": "",
      "numeracao_volumes": "",
      "quantidade_volumes": 0,
      "codigo_tipo_entrega": 0,
      "codigo_transportadora": 0,
      "registro_transportador": ""
    },
    "cabecalho": {
      "etapa": "20",
      "enc_data": "",
      "enc_hora": "",
      "enc_user": "",
      "bloqueado": "N",
      "encerrado": "",
      "enc_motivo": "",
      "codigo_pedido": 9542202219,
      "data_previsao": "15/05/2026",
      "importado_api": "S",
      "numero_pedido": "3061",
      "origem_pedido": "MRC",
      "qtde_parcelas": 1,
      "codigo_cliente": 9542198176,  // ← Também aqui no rawPayload
      "codigo_empresa": 9084171408,
      "codigo_parcela": "A07",
      "quantidade_itens": 1,
      "codigo_cenario_impostos": "9114995573",
      "codigo_pedido_integracao": "157434355"
    },
    "exportacao": {
      "nao_exportacao": "N"
    },
    "observacoes": {
      "obs_venda": "RETIRADA|Número do pedido no Mercos: 1591."
    },
    "infoCadastro": {
      "dAlt": "15/05/2026",
      "dInc": "15/05/2026",
      "hAlt": "16:20:22",
      "hInc": "16:11:02",
      "uAlt": "P000848229",
      "uInc": "WEBSERVICE",
      "denegado": "N",
      "faturado": "N",
      "cancelado": "N",
      "devolvido": "N",
      "autorizado": "N",
      "devolvido_parcial": "N"
    },
    "total_pedido": {
      "valor_ir": 0,
      "valor_st": 0,
      "valor_IPI": 0,
      "valor_cbs": 0,
      "valor_ibs": 0,
      "valor_iss": 0,
      "valor_pis": 0,
      "valor_csll": 0,
      "valor_icms": 0,
      "valor_inss": 0,
      "base_ibs_cbs": 0,
      "valor_cofins": 0,
      "valor_ibs_mu": 0,
      "valor_ibs_uf": 0,
      "valor_dif_cbs": 0,
      "valor_deducoes": 0,
      "base_calculo_st": 0,
      "valor_descontos": 0,
      "valor_dif_ibs_mu": 0,
      "valor_dif_ibs_uf": 0,
      "base_calculo_icms": 0,
      "valor_mercadorias": 210,
      "valor_total_pedido": 210,
      "valor_tot_ibs_cbs_is": 0
    },
    "departamentos": [],
    "lista_parcelas": {
      "parcela": [
        {
          "valor": 210,
          "percentual": 100,
          "meio_pagamento": "15",
          "numero_parcela": 1,
          "tipo_documento": "BOL",
          "data_vencimento": "22/05/2026",
          "quantidade_dias": 7
        }
      ]
    },
    "informacoes_adicionais": {
      "codProj": 0,
      "codVend": 9505758601,
      "contato": "",
      "enviar_pix": "N",
      "enviar_email": "S",
      "numero_contrato": "",
      "outros_detalhes": {
        "cCEPOdRet": "70750-680",
        "cNomeOdRet": "LABARR C DE ORIGEM LTDA",
        "cBairroOdRet": "Asa Norte",
        "cCidadeOdRet": "BRASILIA (DF)",
        "cEstadoOdRet": "DF",
        "cCnpjCpfOdRet": "28.866.837/0001-37",
        "cEnderecoOdRet": "Quadra Scrn 710/711 Bloco h",
        "cTelefoneOdRet": "61991959536",
        "cComplementoOdRet": "LOJA 35"
      },
      "utilizar_emails": "thaismaf@hotmail.com",
      "codigo_categoria": "1.01.99",
      "consumidor_final": "N",
      "dados_adicionais_nf": "",
      "codigo_conta_corrente": 9181190664,
      "numero_pedido_cliente": ""
    }
  },
  "lastSyncAt": "2026-05-18T12:39:43.752Z",
  "items": [
    {
      "description": "70% cacau Tâmaras 1 kg",
      "quantity": "1"
    }
  ]
};

console.log('Testando extração do código do cliente...\n');

// Testar a função extractOmieClientCode
const extractedCode = extractOmieClientCode(orderJson);
console.log('Código extraído:', extractedCode);
console.log('Tipo do código extraído:', typeof extractedCode);
console.log('Valor como string:', extractedCode?.toString());

// Testar também com o rawPayload.cabecalho
const fromRawPayload = extractOmieClientCode(orderJson.rawPayload);
console.log('\nExtraído do rawPayload.cabecalho:', fromRawPayload);
console.log('Tipo:', typeof fromRawPayload);

// Verificar se o código é BigInt(9542198176)
const expectedCode = BigInt('9542198176');
console.log('\nCódigo esperado:', expectedCode);
console.log('Tipo esperado:', typeof expectedCode);
console.log('Extração funcionou?', extractedCode?.toString() === expectedCode.toString());