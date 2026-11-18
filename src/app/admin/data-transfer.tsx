import { useInvalidateQueries } from '@/src/application/hooks/use-invalidate-queries'
import {
  ImportPlan,
  ImportReport,
  SheetRows,
  executeImport,
  planInsertCount,
  prepareImport,
} from '@/src/application/import/xlsx-import.runner'
import {
  copyAssetToCacheAsync,
  shareFileAsync,
} from '@/src/application/services/excel.service'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog'
import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Text } from '@/src/components/ui/text'
import * as DocumentPicker from 'expo-document-picker'
import { File } from 'expo-file-system'
import { Stack } from 'expo-router'
import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  ListChecks,
  Upload,
} from 'lucide-react-native'
import { useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import * as XLSX from 'xlsx'

const SHEET_LABELS = {
  categorias: 'Categorias',
  produtos: 'Produtos',
  clientes: 'Clientes',
} as const

const MAX_LISTED_ISSUES = 100

export default function DataTransferScreen() {
  const [isExporting, setIsExporting] = useState(false)
  // 'idle' | 'analyzing' | 'confirming' | 'importing'
  const [phase, setPhase] = useState<
    'idle' | 'analyzing' | 'confirming' | 'importing'
  >('idle')
  const [progress, setProgress] = useState<{
    label: string
    done: number
    total: number
  } | null>(null)
  const [report, setReport] = useState<ImportReport | null>(null)
  const planRef = useRef<ImportPlan | null>(null)
  const [planSummary, setPlanSummary] = useState<ImportPlan | null>(null)
  const invalidate = useInvalidateQueries()
  const isImporting = phase !== 'idle'

  // Function to copy the asset to cache and share it

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const asset = require('../../assets/template-app-preenchimento.xlsx')

      // 1) Copy the asset to an accessible path (app cache)
      const localPath = await copyAssetToCacheAsync(asset)

      // 2) Share so the user can choose where to save/open
      await shareFileAsync(localPath)

      Toast.show({
        type: 'success',
        text1: 'Template disponibilizado',
        text2: 'Escolha onde salvar ou abrir o arquivo',
      })
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro na exportação',
        text2: 'Não foi possível compartilhar o arquivo Excel',
      })
    } finally {
      setIsExporting(false)
    }
  }

  // 1) Pick the file, read the spreadsheet, validate and deduplicate (without writing)
  const handleImport = async () => {
    setPhase('analyzing')
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      })

      if (result.canceled) {
        setPhase('idle')
        return
      }

      const file = new File(result.assets[0].uri)
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })

      const rows: SheetRows = {}
      for (const name of workbook.SheetNames) {
        const key = name.trim().toLowerCase()
        if (key === 'categorias' || key === 'produtos' || key === 'clientes') {
          rows[key] = XLSX.utils.sheet_to_json<unknown[]>(
            workbook.Sheets[name],
            { header: 1, raw: true, defval: '' }
          )
        }
      }

      if (!rows.categorias && !rows.produtos && !rows.clientes) {
        throw new Error(
          'Nenhuma aba encontrada. O arquivo deve ter: categorias, produtos e/ou clientes.'
        )
      }

      const plan = await prepareImport(rows)
      planRef.current = plan
      setPlanSummary(plan)

      if (planInsertCount(plan) === 0) {
        // Nothing to insert: show the report directly
        setReport({
          inserted: { categorias: 0, produtos: 0, clientes: 0 },
          duplicates: plan.duplicates,
          rejected: plan.rejected,
        })
        setPhase('idle')
        return
      }
      setPhase('confirming')
    } catch (error) {
      setPhase('idle')
      Toast.show({
        type: 'error',
        text1: 'Erro na importação',
        text2:
          error instanceof Error
            ? error.message
            : 'Não foi possível processar o arquivo Excel',
      })
    }
  }

  // 2) User confirmed: write in batches with progress
  const handleConfirmImport = async () => {
    const plan = planRef.current
    if (!plan) return
    setPhase('importing')
    setProgress({
      label: 'Preparando...',
      done: 0,
      total: planInsertCount(plan),
    })
    try {
      const finalReport = await executeImport(plan, (p) => {
        setProgress({
          label: SHEET_LABELS[p.sheet],
          done: p.overallDone,
          total: p.overallTotal,
        })
      })
      // A single invalidation at the end
      invalidate(['categories', 'products', 'customers'])
      setReport(finalReport)
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro na importação',
        text2:
          error instanceof Error ? error.message : 'Falha ao gravar os dados',
      })
      invalidate(['categories', 'products', 'customers'])
    } finally {
      planRef.current = null
      setPlanSummary(null)
      setProgress(null)
      setPhase('idle')
    }
  }

  const handleCancelImport = () => {
    planRef.current = null
    setPlanSummary(null)
    setPhase('idle')
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: 'Importar/Exportar Dados',
          headerShown: true,
        }}
      />

      <ScrollView className="flex-1">
        <View className="gap-6 p-4">
          <Text variant="h3">Gerenciar Dados via Excel</Text>

          <Alert icon={AlertCircle} variant="default">
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription className="text-xs">
              A importação adicionará novos dados ao banco. Certifique-se de
              verificar o arquivo antes de importar.
            </AlertDescription>
          </Alert>

          {/* Export data */}
          <View className="gap-3">
            <Text variant="h4">Baixar Template</Text>
            <Text className="text-muted-foreground">
              Baixe o arquivo template Excel para preencher com os dados de
              categorias, produtos e clientes.
            </Text>

            <View className="bg-destructive-subtle rounded-xl">
              <Alert
                icon={AlertCircle}
                iconClassName="text-destructive"
                variant="destructive"
                className="border-destructive/30 bg-transparent"
              >
                <AlertTitle className="font-medium text-destructive">
                  Aviso!
                </AlertTitle>
                <AlertDescription className="text-xs text-destructive">
                  Todas as tabelas possuem a primeira linha preenchida como
                  exemplo de uso. Remova essa linha antes de importar seus
                  dados.
                </AlertDescription>
              </Alert>
            </View>

            <View className="gap-2 p-3 bg-info-subtle rounded-md border border-info/30">
              <View className="flex-row gap-2 items-center">
                <Icon as={ListChecks} size={20} className="text-info" />
                <Text className="font-medium text-info">
                  Formato da Validade (Produtos)
                </Text>
              </View>
              <View className="gap-1">
                <Text className="text-xs text-info">
                  O campo "validade" aceita os seguintes formatos:
                </Text>
                <Text className="text-xs text-info">
                  • Com espaço: "30 dias", "1 mês", "2 semanas", "1 ano"
                </Text>
                <Text className="text-xs text-info">
                  • Sem espaço: "30dias", "1mês", "2semanas"
                </Text>
                <Text className="text-xs text-info">
                  • Abreviado: "30 d", "2 s", "1 m", "1 a"
                </Text>
                <Text className="text-xs text-info">
                  • Aceita maiúsculas/minúsculas e com/sem acento
                </Text>
              </View>
            </View>

            <Button
              onPress={handleExport}
              disabled={isExporting}
              className="flex-row gap-2"
            >
              {isExporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Icon
                  as={Download}
                  size={20}
                  className="text-primary-foreground"
                />
              )}
              <Text className="text-primary-foreground">
                {isExporting ? 'Preparando...' : 'Baixar Template Excel'}
              </Text>
            </Button>
          </View>

          {/* Import data */}
          <View className="gap-3">
            <Text variant="h4">Importar Dados</Text>
            <Text className="text-muted-foreground">
              Carregue um arquivo Excel com dados de categorias, produtos e
              clientes. O arquivo deve conter as abas: Categorias, Produtos e
              Clientes.
            </Text>

            <View className="gap-2 p-3 bg-muted rounded-md">
              <Text className="font-medium text-sm">Estrutura esperada:</Text>
              <View className="gap-1">
                <Text className="text-xs text-muted-foreground">
                  • Categorias: nome, ativo
                </Text>
                <Text className="text-xs text-muted-foreground">
                  • Produtos: nome, categoria, precoVenda, ativo, validade
                </Text>
                <Text className="text-xs text-muted-foreground">
                  • Clientes: nomeEstabelecimento, nomeContato, telefoneCelular,
                  whatsappCelular, telefoneFixo, whatsappFixo, logradouro,
                  numero, bairro, cidade, cep
                </Text>
              </View>
            </View>

            <Button
              onPress={handleImport}
              disabled={isImporting}
              variant="outline"
              className="flex-row gap-2"
            >
              {isImporting ? (
                <ActivityIndicator />
              ) : (
                <Icon as={Upload} size={20} className="text-foreground" />
              )}
              <Text>
                {phase === 'importing' && progress
                  ? `Importando ${progress.done}/${progress.total}...`
                  : isImporting
                    ? 'Analisando...'
                    : 'Importar do Excel'}
              </Text>
            </Button>
          </View>

          {/* Additional information */}
          <View className="gap-2 p-3 bg-info-subtle rounded-md border border-info/30">
            <View className="flex-row gap-2 items-center">
              <Icon as={FileSpreadsheet} size={20} className="text-info" />
              <Text className="font-medium text-info">
                Dicas para importação
              </Text>
            </View>
            <View className="gap-1">
              <Text className="text-xs text-info">
                • Use 1 para ativo/whatsapp e 0 para inativo/sem whatsapp
              </Text>
              <Text className="text-xs text-info">
                • Formato de validade: "30 dias", "2 meses", etc.
              </Text>
              <Text className="text-xs text-info">
                • CEP deve estar no formato: 01234-567
              </Text>
              <Text className="text-xs text-info">
                • A categoria em Produtos deve corresponder a uma categoria
                existente
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      {/* Confirmation before saving */}
      <AlertDialog
        open={phase === 'confirming'}
        onOpenChange={(open) => {
          if (!open) handleCancelImport()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar importação?</AlertDialogTitle>
            <AlertDialogDescription>
              {planSummary
                ? `Serão adicionados ${planSummary.categories.length} categorias, ${planSummary.products.length} produtos e ${planSummary.customers.length} clientes. ` +
                  `${planSummary.duplicates.length} linhas duplicadas serão ignoradas e ${planSummary.rejected.length} linhas inválidas serão rejeitadas.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancelar</Text>
            </AlertDialogCancel>
            <Button onPress={handleConfirmImport}>
              <Text>Importar</Text>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress (blocks the screen while saving) */}
      <AlertDialog open={phase === 'importing'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importando dados...</AlertDialogTitle>
            <AlertDialogDescription>
              {progress
                ? `${progress.label}: ${progress.done}/${progress.total}`
                : 'Preparando...'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <View className="items-center py-2">
            <ActivityIndicator size="large" />
          </View>
        </AlertDialogContent>
      </AlertDialog>

      {/* Final report */}
      <AlertDialog
        open={report !== null}
        onOpenChange={(open) => {
          if (!open) setReport(null)
        }}
      >
        <AlertDialogContent className="max-h-[80%]">
          <AlertDialogHeader>
            <AlertDialogTitle>Importação concluída</AlertDialogTitle>
            <AlertDialogDescription>
              {report
                ? `Inseridas: ${report.inserted.categorias} categorias, ${report.inserted.produtos} produtos, ${report.inserted.clientes} clientes. Duplicadas: ${report.duplicates.length}. Rejeitadas: ${report.rejected.length}.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {report &&
            (report.rejected.length > 0 || report.duplicates.length > 0) && (
              <ScrollView className="max-h-72">
                <View className="gap-1">
                  {[
                    ...report.rejected.map((r) => ({
                      ...r,
                      kind: 'Rejeitada',
                    })),
                    ...report.duplicates.map((r) => ({
                      ...r,
                      kind: 'Duplicada',
                    })),
                  ]
                    .slice(0, MAX_LISTED_ISSUES)
                    .map((r, i) => (
                      <Text key={i} className="text-xs text-muted-foreground">
                        {`${r.kind} · ${SHEET_LABELS[r.sheet]} linha ${r.line}: ${r.reason}`}
                      </Text>
                    ))}
                  {report.rejected.length + report.duplicates.length >
                    MAX_LISTED_ISSUES && (
                    <Text className="text-xs font-medium">
                      {`... e mais ${report.rejected.length + report.duplicates.length - MAX_LISTED_ISSUES} linhas.`}
                    </Text>
                  )}
                </View>
              </ScrollView>
            )}
          <AlertDialogFooter>
            <Button onPress={() => setReport(null)}>
              <Text>Fechar</Text>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SafeAreaView>
  )
}
