# Sistema de Logmetria

Sistema completo de captura, armazenamento e exportação de logs (erros, warnings e info) para debug e análise.

## 📋 Componentes Implementados

### 1. Banco de Dados

- **Tabela**: `error_log`
- **Campos**:
  - `id`: UUID
  - `timestamp`: número (timestamp em milissegundos)
  - `level`: 'error' | 'warning' | 'info'
  - `message`: texto da mensagem
  - `stackTrace`: stack trace (opcional)
  - `context`: contexto onde ocorreu (opcional)
  - `metadata`: JSON com dados adicionais (opcional)
- **Migration**: `0009_late_kronos.sql`

### 2. Camada de Domínio

- **Entidade**: `ErrorLog` ([error-log.entity.ts](src/domain/entities/error-log/error-log.entity.ts))
- **Validações**: Schemas Zod ([error-log.schema.ts](src/domain/validations/error-log.schema.ts))
- **Repositório (Interface)**: `ErrorLogRepository` ([error-log.repository.ts](src/domain/repositories/error-log/error-log.repository.ts))

### 3. Camada de Infraestrutura

- **Schema Drizzle**: [drizzle.error-log.schema.ts](src/infra/db/drizzle/schema/drizzle.error-log.schema.ts)
- **Repositório (Implementação)**: `DrizzleErrorLogRepository` ([drizzle.error-log.repository.ts](src/infra/repositories/drizzle/drizzle.error-log.repository.ts))

### 4. Camada de Aplicação

- **Service**: [error-logging.service.ts](src/application/services/error-logging.service.ts)
  - `logError()`: Registra erro
  - `logWarning()`: Registra aviso
  - `logInfo()`: Registra informação
  - `buildLogDumpJsonString()`: Gera JSON dos logs
  - `saveLogDumpAndShare()`: Exporta e compartilha logs
  - `cleanupOldLogs()`: Remove logs antigos
  - `clearAllLogs()`: Remove todos os logs

- **Hooks**: [error-log.hooks.ts](src/application/hooks/error-log.hooks.ts)
  - Hooks reativos com TanStack Query

### 5. Utilitários

- **Logger**: [logger.ts](src/lib/logger.ts)
  - Wrapper para `console.log/warn/error` que também persiste no BD
  - Uso: `import logger from '@/src/lib/logger'`

### 6. UI

- **Settings Sheet**: Botões de exportação adicionados
  - "Logs (Dump JSON)" - Exportação rápida
  - "Visualizar Logs" - Tela completa de visualização
- **Tela Admin**: [admin/logs-viewer.tsx](src/app/admin/logs-viewer.tsx)
  - Visualização de logs recentes (últimos 50)
  - Exportação para arquivo JSON
  - Cópia para área de transferência
  - Limpeza de todos os logs
  - Filtros visuais por nível (error/warning/info)

## 🔄 Captura Automática

### 1. ErrorBoundary Global

- Intercepta crashes fatais da aplicação
- Persiste automaticamente no banco
- Localização: [\_layout.tsx](src/app/_layout.tsx#L40-L53)

### 2. TanStack Query Errors

- Captura erros de queries e mutations globalmente
- Configurado no `QueryClient`
- Localização: [\_layout.tsx](src/app/_layout.tsx#L60-L76)

### 3. Limpeza Automática

- Executada no boot do app (após migrations)
- Remove logs com mais de 7 dias
- Localização: [\_layout.tsx](src/app/_layout.tsx#L169-L173)

## 📊 Formato de Exportação

```json
{
  "version": 1,
  "createdAt": "2026-03-03T10:30:00.000Z",
  "appVersion": "1.1.3",
  "deviceInfo": {
    "platform": "android",
    "osVersion": "14"
  },
  "logs": [
    {
      "id": "uuid-here",
      "timestamp": 1709463000000,
      "timestampISO": "2026-03-03T10:30:00.000Z",
      "level": "error",
      "message": "Erro ao carregar dados",
      "stackTrace": "Error: ...\n  at ...",
      "context": "TanStack Query",
      "metadata": {
        "retry": 1
      }
    }
  ]
}
```

## 🎯 Como Usar

### Uso Manual (Opcional)

```typescript
import logger from '@/src/lib/logger'

// Informação
logger.log('Operação concluída', 'MeuComponente')

// Aviso
logger.warn('Dados ausentes', 'MeuComponente', { userId: '123' })

// Erro
logger.error('Falha na requisição', error, 'MeuComponente', {
  endpoint: '/api/data',
})
```

### Exportação para Cliente

1. Abrir app
2. Tocar no ícone de configurações (tela inicial)
3. Clicar em "Logs (Dump JSON)"
4. Compartilhar arquivo via WhatsApp, Email, etc.

### Visualização de Logs (Admin)

1. Abrir configurações
2. Clicar em "Visualizar Logs"
3. Ver logs recentes com filtros visuais
4. Opções: exportar, copiar ou limpar

## ⚙️ Configurações

### Retenção de Logs

- **Padrão**: 7 dias
- **Modificar**: Alterar parâmetro em [\_layout.tsx](src/app/_layout.tsx#L169):
  ```typescript
  cleanupOldLogs(7) // Alterar número de dias
  ```

### Captura Automática

- **ErrorBoundary**: Sempre ativo
- **TanStack Query**: Sempre ativo
- **Limpeza**: Executada no boot

## 🔍 Níveis de Log

| Nível   | Ícone | Cor      | Uso                              |
| ------- | ----- | -------- | -------------------------------- |
| error   | ⚠️    | Vermelho | Erros críticos, crashes          |
| warning | ⚠️    | Amarelo  | Avisos, situações suspeitas      |
| info    | ℹ️    | Azul     | Informações, eventos importantes |

## 📱 Acesso

- **Exportação rápida**: Configurações → "Logs (Dump JSON)"
- **Visualização completa**: Configurações → "Visualizar Logs"
- **Apenas Admin**: Ambas as funcionalidades disponíveis apenas para licenças admin

## 🛠️ Manutenção

### Limpar Logs Manualmente

1. Acessar "Visualizar Logs"
2. Clicar em "Limpar Todos os Logs"

### Ver Logs no DB

- Usar Drizzle Studio durante desenvolvimento
- Conectar ao banco SQLite diretamente

## ✅ Verificação

Para testar o sistema:

1. Forçar um erro em algum componente
2. Verificar se foi capturado em "Visualizar Logs"
3. Exportar e abrir o JSON
4. Confirmar que dados estão corretos
