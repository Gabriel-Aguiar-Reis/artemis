import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { customerHooks } from '@/src/application/hooks/customer.hooks'
import { productHooks } from '@/src/application/hooks/product.hooks'
import {
  copyAssetToCacheAsync,
  shareFileAsync,
} from '@/src/application/services/excel.service'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Text } from '@/src/components/ui/text'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { category } from '@/src/infra/db/drizzle/schema/drizzle.category.schema'
import { UUID } from '@/src/lib/utils'
import { eq } from 'drizzle-orm'
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
import { useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import uuid from 'react-native-uuid'
import * as XLSX from 'xlsx'

export default function DataTransferScreen() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const { mutateAsync: addCategory } = categoryHooks.addCategory()
  const { mutateAsync: addProduct } = productHooks.addProduct()
  const { mutateAsync: addCustomer } = customerHooks.addCustomer()

  // Função para copiar asset para cache e compartilhar

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const asset = require('../../assets/template-app-preenchimento.xlsx')

      // 1) Copia o asset para um caminho acessível (cache do app)
      const localPath = await copyAssetToCacheAsync(asset)

      // 2) Compartilhar para que o usuário escolha onde salvar/abrir
      await shareFileAsync(localPath)

      Toast.show({
        type: 'success',
        text1: 'Template disponibilizado',
        text2: 'Escolha onde salvar ou abrir o arquivo',
      })
    } catch (error) {
      console.error('Erro ao exportar:', error)
      Toast.show({
        type: 'error',
        text1: 'Erro na exportação',
        text2: 'Não foi possível compartilhar o arquivo Excel',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    try {
      // Selecionar arquivo
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      })

      if (result.canceled) {
        setIsImporting(false)
        return
      }

      const pickedFile = result.assets[0]

      // Ler arquivo com a nova API
      const file = new File(pickedFile.uri)
      const arrayBuffer = await file.arrayBuffer()

      // Ler workbook usando XLSX
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })

      let categoriesImported = 0
      let productsImported = 0
      let customersImported = 0

      console.log('Abas disponíveis:', workbook.SheetNames)

      // Mapa para armazenar categorias (nome -> id)
      const categoryMap = new Map<string, string>()

      // === Importar Categorias ===
      const categorySheetName = workbook.SheetNames.find(
        (name) => name === 'categorias'
      )
      if (categorySheetName) {
        console.log('Processando aba de categorias...')
        const categorySheet = workbook.Sheets[categorySheetName]
        const categoryRows = XLSX.utils.sheet_to_json<any>(categorySheet, {
          header: 1,
        })

        console.log(`Total de linhas em categorias: ${categoryRows.length}`)

        // Preparar todas as categorias para importação em lote
        const categoriesToImport: Array<{
          id: string
          name: string
          isActive: boolean
        }> = []

        // Pular primeira linha (cabeçalho)
        for (let i = 1; i < categoryRows.length; i++) {
          const row = categoryRows[i]
          const name = String(row[0] || '').trim()
          const isActive = Number(row[1]) === 1

          console.log(`Categoria linha ${i + 1}:`, { name, isActive })

          if (!name) {
            console.warn(`Categoria linha ${i + 1}: nome vazio, pulando`)
            continue
          }

          const id = String(uuid.v4())
          categoriesToImport.push({ id, name, isActive })
          categoryMap.set(name, id)
        }

        // Importar todas as categorias sequencialmente para garantir que sejam inseridas
        for (const cat of categoriesToImport) {
          try {
            console.log(`Tentando inserir categoria:`, cat)
            await addCategory(cat)
            categoriesImported++

            // Verificar se a categoria realmente foi inserida no banco
            const categoryInDb = db
              .select()
              .from(category)
              .where(eq(category.id, cat.id))
              .limit(1)
              .get()

            if (categoryInDb) {
              console.log(
                `✅ Categoria "${cat.name}" confirmada no banco (ID: ${cat.id})`
              )
            } else {
              console.error(
                `❌ Categoria "${cat.name}" NÃO foi encontrada no banco após inserção!`
              )
              categoryMap.delete(cat.name)
            }
          } catch (error) {
            console.error(`Erro ao importar categoria "${cat.name}":`, error)
            // Remove do mapa se falhar
            categoryMap.delete(cat.name)
          }
        }

        console.log(
          'Mapa de categorias após importação:',
          Array.from(categoryMap.entries())
        )
      } else {
        console.warn('Aba "categorias" não encontrada')
      }

      // === Importar Produtos ===
      const productSheetName = workbook.SheetNames.find(
        (name) => name === 'produtos'
      )
      if (productSheetName) {
        console.log('Processando aba de produtos...')
        const productSheet = workbook.Sheets[productSheetName]
        const productRows = XLSX.utils.sheet_to_json<any>(productSheet, {
          header: 1,
        })

        console.log(`Total de linhas em produtos: ${productRows.length}`)

        // Pular primeira linha (cabeçalho)
        for (let i = 1; i < productRows.length; i++) {
          const row = productRows[i]
          const name = String(row[0] || '').trim()
          const categoryName = String(row[1] || '').trim()
          const salePrice = Number(row[2])
          const isActive = Number(row[3]) === 1
          const expirationValue = String(row[4] || '').trim()

          console.log(`Produto linha ${i + 1}:`, {
            name,
            categoryName,
            salePrice,
            isActive,
            expirationValue,
          })

          if (!name) {
            console.warn(`Produto linha ${i + 1}: nome vazio, pulando`)
            continue
          }

          if (!categoryName) {
            console.warn(`Produto linha ${i + 1}: categoria vazia, pulando`)
            continue
          }

          const categoryId = categoryMap.get(categoryName)
          if (!categoryId) {
            console.error(
              `Produto linha ${i + 1}: Categoria "${categoryName}" não encontrada no mapa`
            )
            console.error(
              'Categorias disponíveis no mapa:',
              Array.from(categoryMap.keys())
            )
            continue
          }

          console.log(
            `Produto linha ${i + 1}: categoryId encontrado: ${categoryId}`
          )

          // Verificar se a categoria existe no banco antes de inserir o produto
          const categoryInDb = db
            .select()
            .from(category)
            .where(eq(category.id, categoryId as UUID))
            .limit(1)
            .get()

          if (!categoryInDb) {
            console.error(
              `❌ Produto linha ${i + 1}: Categoria com ID "${categoryId}" NÃO existe no banco!`
            )
            continue
          }

          console.log(
            `✅ Categoria confirmada no banco para o produto:`,
            categoryInDb
          )

          try {
            const id = uuid.v4()
            const productData = {
              id,
              name,
              categoryId,
              salePrice,
              isActive,
              expiration: expirationValue,
            }
            console.log(`Tentando inserir produto:`, productData)
            await addProduct(productData)
            productsImported++
            console.log(`Produto "${name}" importado com sucesso`)
          } catch (error) {
            console.error(`Erro ao importar produto linha ${i + 1}:`, error)
          }
        }
      } else {
        console.warn('Aba "produtos" não encontrada')
      }

      // === Importar Clientes ===
      const customerSheetName = workbook.SheetNames.find(
        (name) => name === 'clientes'
      )
      if (customerSheetName) {
        console.log('Processando aba de clientes...')
        const customerSheet = workbook.Sheets[customerSheetName]
        const customerRows = XLSX.utils.sheet_to_json<any>(customerSheet, {
          header: 1,
        })

        console.log(`Total de linhas em clientes: ${customerRows.length}`)

        // Pular primeira linha (cabeçalho)
        for (let i = 1; i < customerRows.length; i++) {
          const row = customerRows[i]
          const storeName = String(row[0] || '').trim()
          const contactName = String(row[1] || '').trim()
          const phoneNumberValue = String(row[2] || '').trim()
          const phoneWhatsApp = Number(row[3]) === 1
          const landlineNumberValue = String(row[4] || '').trim()
          const landlineWhatsApp = Number(row[5]) === 1
          const streetName = String(row[6] || '').trim()
          const streetNumber = String(row[7] || '').trim()
          const neighborhood = String(row[8] || '').trim()
          const city = String(row[9] || '').trim()
          const zipCode = String(row[10] || '').trim()

          console.log(`Cliente linha ${i + 1}:`, {
            storeName,
            contactName,
            phoneNumberValue,
            phoneWhatsApp,
            landlineNumberValue,
            landlineWhatsApp,
            streetName,
            streetNumber,
            neighborhood,
            city,
            zipCode,
          })

          if (!storeName) {
            console.warn(
              `Cliente linha ${i + 1}: nome do estabelecimento vazio, pulando`
            )
            continue
          }

          if (!contactName) {
            console.warn(
              `Cliente linha ${i + 1}: nome de contato vazio, pulando`
            )
            continue
          }

          try {
            const id = uuid.v4()
            await addCustomer({
              id,
              storeName,
              contactName,
              addressStreetName: streetName,
              addressStreetNumber: streetNumber,
              addressNeighborhood: neighborhood,
              addressCity: city,
              addressState: 'SP',
              addressZipCode: zipCode,
              phoneNumber: phoneNumberValue || undefined,
              phoneIsWhatsApp: phoneWhatsApp,
              landlineNumber: landlineNumberValue || undefined,
              landlineIsWhatsApp: landlineWhatsApp,
            })
            customersImported++
            console.log(`Cliente "${storeName}" importado com sucesso`)
          } catch (error) {
            console.error(`Erro ao importar cliente linha ${i + 1}:`, error)
          }
        }
      } else {
        console.warn('Aba "clientes" não encontrada')
      }

      Toast.show({
        type: 'success',
        text1: 'Importação concluída',
        text2: `${categoriesImported} categorias, ${productsImported} produtos, ${customersImported} clientes`,
      })

      console.log('Importação finalizada:', {
        categoriesImported,
        productsImported,
        customersImported,
      })
    } catch (error) {
      console.error('Erro ao importar:', error)
      Toast.show({
        type: 'error',
        text1: 'Erro na importação',
        text2:
          error instanceof Error
            ? error.message
            : 'Não foi possível processar o arquivo Excel',
      })
    } finally {
      setIsImporting(false)
    }
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

          {/* Exportar Dados */}
          <View className="gap-3">
            <Text variant="h4">Baixar Template</Text>
            <Text className="text-muted-foreground">
              Baixe o arquivo template Excel para preencher com os dados de
              categorias, produtos e clientes.
            </Text>

            <View className="bg-red-50 dark:bg-red-950 rounded-xl">
              <Alert
                icon={AlertCircle}
                iconClassName="text-red-400"
                variant="destructive"
                className="border-red-200 dark:border-red-800 bg-transparent"
              >
                <AlertTitle className="font-medium text-red-800 dark:text-red-200">
                  Aviso!
                </AlertTitle>
                <AlertDescription className="text-xs text-red-700 dark:text-red-300">
                  Todas as tabelas possuem a primeira linha preenchida como
                  exemplo de uso. Remova essa linha antes de importar seus
                  dados.
                </AlertDescription>
              </Alert>
            </View>

            <View className="gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
              <View className="flex-row gap-2 items-center">
                <Icon as={ListChecks} size={20} className="text-blue-600" />
                <Text className="font-medium text-blue-800 dark:text-blue-200">
                  Formato da Validade (Produtos)
                </Text>
              </View>
              <View className="gap-1">
                <Text className="text-xs text-blue-700 dark:text-blue-300">
                  O campo "validade" aceita os seguintes formatos:
                </Text>
                <Text className="text-xs text-blue-700 dark:text-blue-300">
                  • Com espaço: "30 dias", "1 mês", "2 semanas", "1 ano"
                </Text>
                <Text className="text-xs text-blue-700 dark:text-blue-300">
                  • Sem espaço: "30dias", "1mês", "2semanas"
                </Text>
                <Text className="text-xs text-blue-700 dark:text-blue-300">
                  • Abreviado: "30 d", "2 s", "1 m", "1 a"
                </Text>
                <Text className="text-xs text-blue-700 dark:text-blue-300">
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

          {/* Importar Dados */}
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
              <Text>{isImporting ? 'Importando...' : 'Importar do Excel'}</Text>
            </Button>
          </View>

          {/* Informações Adicionais */}
          <View className="gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
            <View className="flex-row gap-2 items-center">
              <Icon as={FileSpreadsheet} size={20} className="text-blue-600" />
              <Text className="font-medium text-blue-800 dark:text-blue-200">
                Dicas para importação
              </Text>
            </View>
            <View className="gap-1">
              <Text className="text-xs text-blue-700 dark:text-blue-300">
                • Use 1 para ativo/whatsapp e 0 para inativo/sem whatsapp
              </Text>
              <Text className="text-xs text-blue-700 dark:text-blue-300">
                • Formato de validade: "30 dias", "2 meses", etc.
              </Text>
              <Text className="text-xs text-blue-700 dark:text-blue-300">
                • CEP deve estar no formato: 01234-567
              </Text>
              <Text className="text-xs text-blue-700 dark:text-blue-300">
                • A categoria em Produtos deve corresponder a uma categoria
                existente
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
