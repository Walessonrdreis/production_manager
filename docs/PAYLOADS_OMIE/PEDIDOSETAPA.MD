Requisição cURL:
curl -s https://app.omie.com.br/api/v1/produtos/pedidoetapas/ \
 -H 'Content-type: application/json' \
 -d '{"call":"ListarEtapasPedido","param":[{"nPagina":1,"nRegPorPagina":1}],"app_key":"#APP_KEY#","app_secret":"#APP_SECRET#"}'
Cabeçalho
Content-Type: application/json; encoding=UTF-8
Corpo
{
  "nPagina": 1,
  "nTotPaginas": 12726,
  "nRegistros": 1,
  "nTotRegistros": 12726,
  "etapasPedido": [
    {
      "cCodIntPed": "",
      "cEtapa": "00",
      "cNumero": "2505",
      "cancelamento": {
        "cCancelado": "S",
        "cHrCanc": "09:19:58",
        "cUsCanc": "P001111372",
        "dDtCanc": "03/03/2026"
      },
      "devolucao": {
        "cDevolvido": "N"
      },
      "faturamento": {
        "cFaturado": "N"
      },
      "info": {
        "cImpAPI": "N",
        "dAlt": "03/03/2026",
        "dInc": "03/03/2026",
        "hAlt": "08:08:59",
        "hInc": "08:08:43",
        "uAlt": "P001111372",
        "uInc": "P001111372"
      },
      "nCodPed": 9515202103
    }
  ]
}