#!/usr/bin/env node
import ExcelJS from 'exceljs'
import path from 'path'

const outFile = path.resolve(process.cwd(), 'entities-template.xlsx')

type SheetSpec = {
  name: string
  columns: { key: string; header: string; example?: string | number }[]
}

const specs: SheetSpec[] = [
  {
    name: 'categorias',
    columns: [
      { key: 'name', header: 'nome', example: 'Bebidas' },
      { key: 'isActive', header: 'ativo', example: 1 },
    ],
  },
  {
    name: 'produtos',
    columns: [
      { key: 'name', header: 'nome', example: 'Coca-Cola 2L' },
      { key: 'categoryName', header: 'categoria', example: 'Bebidas' },
      { key: 'salePrice', header: 'precoVenda', example: 9.9 },
      { key: 'isActive', header: 'ativo', example: 1 },
      { key: 'expiration', header: 'validade', example: '30 dias' },
    ],
  },
  {
    name: 'clientes',
    columns: [
      {
        key: 'storeName',
        header: 'nomeEstabelecimento',
        example: 'Mercadinho do Zé',
      },
      { key: 'contactName', header: 'nomeContato', example: 'José Silva' },
      {
        key: 'phoneNumber.value',
        header: 'telefoneCelular',
        example: '5511999999999',
      },
      {
        key: 'phoneNumber.isWhatsApp',
        header: 'whatsappCelular',
        example: 1,
      },
      {
        key: 'landlineNumber.value',
        header: 'telefoneFixo',
        example: '1133334444',
      },
      {
        key: 'landlineNumber.isWhatsApp',
        header: 'whatsappFixo',
        example: 0,
      },
      {
        key: 'storeAddress.streetName',
        header: 'logradouro',
        example: 'Rua A',
      },
      { key: 'storeAddress.streetNumber', header: 'numero', example: 123 },
      { key: 'storeAddress.neighborhood', header: 'bairro', example: 'Centro' },
      { key: 'storeAddress.city', header: 'cidade', example: 'São Paulo' },
      { key: 'storeAddress.zipCode', header: 'cep', example: '01234-567' },
    ],
  },
]

async function build() {
  const wb = new ExcelJS.Workbook()
  for (const spec of specs) {
    const ws = wb.addWorksheet(spec.name)
    ws.columns = spec.columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: Math.max(12, c.header.length + 2),
    }))
    // Add example row
    const exampleRow: Record<string, any> = {}
    for (const c of spec.columns) exampleRow[c.key] = c.example ?? ''
    ws.addRow(exampleRow)
    // Style header
    ws.getRow(1).font = { bold: true }
    ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
  }

  // Add data validation (dropdown) for products.categoria referencing Categorias!$A$2:$A$100
  const prodSheet = wb.getWorksheet('products')
  const categoriasSheet = wb.getWorksheet('Categorias')
  if (prodSheet && categoriasSheet) {
    // ensure there's at least a few rows in Categorias for the reference
    for (let i = 2; i <= 5; i++) {
      if (
        !categoriasSheet.getRow(i).values ||
        categoriasSheet.getRow(i).values.length === 0
      ) {
        categoriasSheet.getRow(i).getCell(1).value = ''
        categoriasSheet.getRow(i).commit()
      }
    }

    const categoriaColIndex =
      prodSheet.columns.findIndex((c) => c.header === 'categoria') + 1
    if (categoriaColIndex > 0) {
      const maxRows = 200
      for (let r = 2; r <= maxRows; r++) {
        const cell = prodSheet.getRow(r).getCell(categoriaColIndex)
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          showErrorMessage: true,
          showInputMessage: true,
          promptTitle: 'Escolha uma categoria',
          prompt: 'Selecione o nome da categoria (ou escreva um novo).',
          formulae: ['=Categorias!$A$2:$A$100'],
        }
      }
    }
  }

  await wb.xlsx.writeFile(outFile)
  console.log(`Generated ${outFile}`)
}

build().catch((err) => {
  console.error('Error generating workbook:', err)
  process.exit(1)
})
