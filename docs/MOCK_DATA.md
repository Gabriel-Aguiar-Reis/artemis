# Dados Mock - Artemis

Este documento descreve o sistema de dados mock do Artemis, usado para desenvolvimento e testes.

## 📋 Visão Geral

O arquivo `src/assets/mock-data.json` contém um conjunto completo de dados simulados que representa aproximadamente 2-3 semanas de uso real do aplicativo. Este arquivo pode ser importado no app através da funcionalidade nativa de importação de dados.

## 🚀 Como Usar

### Passo 1: Injetar arquivo no dispositivo

Execute o comando:

```bash
npm run inject:mock
```

**O que acontece:**

- Verifica se há um emulador Android ou dispositivo físico conectado
- Copia o arquivo `mock-data.json` para `/sdcard/Download/` do dispositivo
- Exibe instruções para os próximos passos

**Requisitos:**

- Emulador Android rodando OU dispositivo físico conectado via USB
- ADB configurado (normalmente já vem com Android Studio)

### Passo 2: Importar no aplicativo

1. Abra o app Artemis no dispositivo/emulador
2. Navegue até: **Admin → Importar Dados do Dispositivo**
3. Selecione o arquivo `mock-data.json` da pasta **Downloads**
4. Confirme a importação

⚠️ **Atenção:** A importação **substitui todos os dados existentes** no aplicativo!

## 📊 Estrutura dos Dados Mock

### Resumo do Dataset

| Tipo de Dados             | Quantidade | Descrição                                           |
| ------------------------- | ---------- | --------------------------------------------------- |
| **Categorias**            | 5          | Bebidas, Alimentos, Limpeza, Higiene, Descartáveis  |
| **Produtos**              | 24         | Produtos diversos distribuídos entre as categorias  |
| **Clientes**              | 12         | Estabelecimentos comerciais em São Paulo            |
| **Itinerários**           | 3          | Uma semana finalizada, uma em andamento, uma futura |
| **Pedidos (Work Orders)** | 25         | Pedidos com status variados                         |
| **Itens de Pedido**       | 80+        | Produtos associados aos pedidos                     |
| **Ordens de Pagamento**   | 25         | Diferentes métodos de pagamento                     |
| **Resultados de Pedidos** | 9          | Pedidos finalizados com resultados                  |

### Categorias (5)

- **Bebidas**: Refrigerantes, água, sucos
- **Alimentos**: Arroz, feijão, café, açúcar, óleo, macarrão
- **Limpeza**: Detergente, desinfetante, amaciante, sabão em pó, água sanitária
- **Higiene**: Sabonete, shampoo, condicionador, papel higiênico
- **Descartáveis**: Copos, pratos, guardanapos

### Produtos (24)

Exemplos:

- Coca-Cola 2L (R$ 8,50)
- Guaraná Antarctica 2L (R$ 7,90)
- Arroz Tipo 1 5kg (R$ 28,90)
- Feijão Carioca 1kg (R$ 7,50)
- Detergente Líquido 500ml (R$ 2,80)
- Papel Higiênico 12 rolos (R$ 18,90)

Todos os produtos têm:

- Preço de venda realista
- Categoria associada
- Prazo de validade
- Status ativo

### Clientes (12)

Estabelecimentos comerciais variados em São Paulo:

- Mercado São José (Centro)
- Minimercado Silva (Bela Vista)
- Padaria Doce Sabor (Santa Cecília)
- Mercearia Bom Preço (Consolação)
- Bar do Zé (Jardins)
- Lanchonete Central (República)
- E mais...

Cada cliente possui:

- Nome do estabelecimento
- Nome do contato
- Telefone e WhatsApp
- Telefone fixo (alguns)
- Endereço completo (rua, número, bairro, cidade, estado, CEP)

### Itinerários (3)

1. **Semana 1 (17-21 Fev)** - ✅ Finalizado
   - 9 pedidos completados
   - Todos com resultados registrados

2. **Semana 2 (24-28 Fev)** - 🔄 Em andamento
   - 5 pedidos em progresso
   - Visitas realizadas mas não finalizadas

3. **Semana 3 (03-07 Mar)** - 📅 Futuro
   - 11 pedidos pendentes
   - Agendados mas ainda não visitados

### Work Orders (Pedidos) - 25 Total

**Status distribuídos:**

- ✅ `COMPLETED`: 9 pedidos (semana 1)
- 🔄 `IN_PROGRESS`: 5 pedidos (semana 2)
- 📋 `PENDING`: 11 pedidos (semana 3)

**Características:**

- Relacionados a clientes reais do mock
- Datas de criação e atualização realistas
- Notas e observações em alguns pedidos
- Ordens de pagamento associadas
- Alguns com resultados de execução

### Ordens de Pagamento (Payment Orders)

**Métodos de pagamento:**

- 💵 Dinheiro
- 💳 Cartão de Crédito (com parcelamento)
- 💳 Cartão de Débito
- 📱 Pix

**Estados:**

- Pagos (pedidos completados)
- Parcialmente pagos (parcelados)
- Não pagos (pedidos pendentes/em progresso)

### Resultados de Pedidos (Work Order Results)

9 pedidos completados com resultados detalhados, incluindo:

**Tipos de itens nos resultados:**

- ✓ `EXCHANGED`: Produto trocado conforme pedido original
- ➕ `ADDED`: Produto adicionado durante a visita
- ➖ `REMOVED`: Produto devolvido/removido

**Exemplos de cenários:**

- Cliente trocou Fanta por Sprite (2 unidades)
- Pedido extra de copos descartáveis no Bar do Zé
- Devolução de detergente com vencimento próximo

## 🔧 Modificando os Dados Mock

Para criar/modificar dados mock:

1. Edite o arquivo `src/assets/mock-data.json`
2. Siga a estrutura do schema (ver seção abaixo)
3. Mantenha a consistência dos IDs entre relacionamentos
4. Execute `npm run inject:mock` para atualizar no dispositivo

### Schema do Arquivo

```json
{
  "version": 1,
  "createdAt": "ISO 8601 timestamp",
  "tables": {
    "category": [...],
    "product": [...],
    "customer": [...],
    "license": [...],
    "paymentOrder": [...],
    "itinerary": [...],
    "workOrder": [...],
    "workOrderItem": [...],
    "workOrderResult": [...],
    "workOrderResultItem": [...],
    "itineraryWorkOrder": [...]
  }
}
```

### Ordem de Dependências

Ao criar novos dados, respeite a ordem de dependências:

1. ⬜ **Sem dependências**: `category`, `customer`, `license`
2. 📦 **Depende de categoria**: `product`
3. 📅 **Independentes**: `itinerary`, `paymentOrder`, `workOrderResult`
4. 📋 **Depende de cliente, pagamento e resultado**: `workOrder`
5. 🛒 **Depende de pedido e produto**: `workOrderItem`
6. 📊 **Depende de resultado e produto**: `workOrderResultItem`
7. 🗺️ **Depende de itinerário e pedido**: `itineraryWorkOrder`

### Campos Importantes

**UUIDs:**

- Use IDs descritivos no mock (ex: `cat-bebidas-001`) para facilitar leitura
- Em produção, o app usa UUIDs v4 reais

**Datas:**

- Formato ISO 8601: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Datas simples: `YYYY-MM-DD`

**Enums:**

- `WorkOrderStatus`: PENDING | COMMITTED | IN_PROGRESS | COMPLETED | PARTIAL | CANCELLED | FAILED | EXPIRED | COPIED
- `WorkOrderResultItemType`: EXCHANGED | ADDED | REMOVED

## 📚 Referências

- **Código de importação**: `src/application/services/dump.service.ts`
- **Tela de importação**: `src/app/admin/data-dump.tsx`
- **Schemas do banco**: `src/infra/db/drizzle/schema/*.schema.ts`
- **Testes com dados mock**: `src/application/services/__tests__/dump.service.test.ts`

## 🐛 Troubleshooting

### "Nenhum dispositivo Android conectado"

**Solução:**

- Execute `./start-android.sh` para iniciar o emulador automaticamente, ou
- Conecte um dispositivo físico via USB e habilite USB Debugging

### "Arquivo não encontrado no app"

**Verificar:**

1. O arquivo foi copiado? Execute `adb shell ls /sdcard/Download/mock-data.json`
2. O app tem permissão para acessar o armazenamento?

### "Erro na importação"

**Possíveis causas:**

- JSON malformado (valide com um JSON linter)
- IDs de relacionamento inconsistentes (ex: `productId` não existe na tabela `product`)
- Tipos de dados incorretos (ex: número como string)
- Campos obrigatórios faltando

**Foreign key constraint failed:**

Este erro ocorre quando há dependências circulares ou ordem incorreta na importação. A partir da versão atual, a ordem de inserção já está corrigida para respeitar todas as foreign keys:

1. category, customer, license (independentes)
2. product (depende de category)
3. itinerary, paymentOrder, **workOrderResult** (independentes)
4. workOrder (depende de customer + paymentOrder + **workOrderResult**)
5. workOrderItem (depende de workOrder + product)
6. workOrderResultItem (depende de workOrderResult + product)
7. itineraryWorkOrder (última)

> **Nota importante**: `workOrderResult` deve ser inserido **antes** de `workOrder`, pois workOrder pode referenciar um resultado via `resultId`.

**Depuração:**

- Verifique os logs do app durante a importação
- Compare com o formato dos testes em `dump.service.test.ts`

## 💡 Dicas

- **Backup antes de importar**: Exporte seus dados atuais antes de importar o mock
- **Teste incremental**: Comece com poucos dados e vá expandindo
- **Reutilize UUIDs**: Mantenha IDs consistentes para facilitar debugging
- **Dados realistas**: Use nomes brasileiros, endereços de SP, preços do mercado
- **Varie os status**: Tenha pedidos em diferentes estados para testar todas as telas
