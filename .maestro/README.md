# QA com Maestro

Fluxos end-to-end do app rodando num emulador Android com massa no volume de um
cliente real (5 mil clientes, 15 mil OS, ~80 itinerários no histórico).

## Preparação

1. Build de debug instalado e Metro rodando **sem** `CI=1` (com `CI=1` o Metro
   não observa arquivos e o app fica com JS antigo):

   ```sh
   npx expo run:android --no-bundler
   npx expo start --dev-client
   adb reverse tcp:8081 tcp:8081
   ```

2. Abra o app uma vez (cria o banco e roda as migrations) e injete a massa:

   ```sh
   .maestro/scripts/seed-device.sh caminho/para/mock-data.json
   ```

   O script usa um `mock-data.json` (dados fictícios) como base, completa até o
   volume alvo e deixa a licença ativa para o QA.

## Rodando

Os fluxos dependem do estado deixado pelos anteriores; rode na ordem, logo após
semear:

```sh
maestro test .maestro/01-customer-search-accents.yaml \
  .maestro/02-create-work-order-full.yaml \
  .maestro/03-itinerary-visit-report.yaml \
  .maestro/04-finish-itinerary.yaml \
  .maestro/06-itinerary-history.yaml \
  .maestro/05-create-itinerary.yaml \
  .maestro/07-delete-paid-work-order-warning.yaml \
  .maestro/08-work-order-list-scroll.yaml \
  .maestro/09-delete-customer-with-orders.yaml \
  .maestro/10-paid-report-read-only.yaml \
  .maestro/11-work-orders-on-demand.yaml \
  .maestro/12-itinerary-details-search.yaml \
  .maestro/13-last-tab-restored.yaml \
  .maestro/14-filters-survive-cold-start.yaml \
  .maestro/15-form-return-navigation.yaml
```

Os filtros de cada aba sobrevivem ao fechamento do app, então os fluxos que precisam de uma lista limpa chamam `subflows/reset-filters.yaml` no início.

Roteiros só de prints (sem asserções) ficam em `.maestro/visual/`: tema claro/escuro, status dos cards e espaçamento dos formulários.

| Fluxo | O que cobre |
| --- | --- |
| 01 | Busca de clientes sem acento ("sao judas" → "São Judas") |
| 02 | OS completa (itens + relatório + pagamento pago) numa transação; busca sem acento nos comboboxes; checkbox clicável pelo rótulo |
| 03 | Relatório pelo itinerário: status em maiúsculo, "atrasado" limpo |
| 04 | Finalizar itinerário com OS pendentes pede confirmação; atrasadas viram expiradas |
| 05 | Novo itinerário: prévia = gravado, OS do último dia entram, contagem de dias |
| 06 | Histórico agregado no SQL |
| 07 | Busca + filtro "pago" (COUNT com join) e aviso ao excluir OS paga |
| 08 | Rolagem longa de uma busca ampla, com paginação e "voltar ao topo" |
| 09 | Excluir cliente com OS mostra mensagem amigável |
| 10 | Relatório de OS paga é somente leitura |
| 11 | Aba OS começa vazia (nada é consultado); busca no topo sem acento; "Agendadas hoje" |
| 12 | Detalhes do itinerário: botão de busca filtra as OS do itinerário |
| 13 | A última aba aberta volta após fechar o app (padrão: Itinerário) |
| 14 | Os filtros de cada aba voltam após fechar o app; limpar também persiste |
| 15 | Voltar de formulários reaproveita as abas existentes (sem pilha duplicada); cancela o itinerário, então roda por último |
