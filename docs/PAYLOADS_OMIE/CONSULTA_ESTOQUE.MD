curl -s https://app.omie.com.br/api/v1/estoque/consulta/ \
 -H 'Content-type: application/json' \
 -d '{"call":"ListarPosEstoque","param":[{"nPagina":1,"nRegPorPagina":1,"dDataPosicao":"26/06/2026","cExibeTodos":"N","codigo_local_estoque":9169896468}],"app_key":"#APP_KEY#","app_secret":"#APP_SECRET#"}'
Cabeçalho
Content-Type: application/json; encoding=UTF-8
Corpo
{
  "nPagina": 1,
  "nTotPaginas": 1088,
  "nRegistros": 1,
  "nTotRegistros": 1088,
  "dDataPosicao": "26/06/2026",
  "produtos": [
    {
      "cCodInt": "",
      "cCodigo": "100P",
      "cDescricao": "100% cacau - Extra Intenso 30g",
      "codigo_local_estoque": 9169896468,
      "estoque_minimo": 1,
      "fisico": 27,
      "nCMC": 5.055731,
      "nCodProd": 9116171984,
      "nPendente": 0,
      "nPrecoUnitario": 16,
      "nSaldo": 27,
      "reservado": 0
    }
  ]
}