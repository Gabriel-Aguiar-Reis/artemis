#!/bin/bash

# Script para injetar arquivo mock-data.json no emulador/dispositivo Android
# Uso: ./inject-mock-data.sh

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "📦 Artemis - Injeção de Dados Mock"
echo "=================================="
echo ""

# Configurar variáveis de ambiente do Android
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# Verificar se o arquivo mock existe
MOCK_FILE="src/assets/mock-data.json"

if [ ! -f "$MOCK_FILE" ]; then
  echo -e "${RED}❌ Erro: Arquivo $MOCK_FILE não encontrado!${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Arquivo mock encontrado: $MOCK_FILE"
echo ""

# Verificar se há dispositivos conectados
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)

if [ $DEVICES -eq 0 ]; then
  echo -e "${RED}❌ Nenhum dispositivo Android conectado!${NC}"
  echo ""
  echo "Você precisa:"
  echo "  1. Iniciar o emulador Android, ou"
  echo "  2. Conectar um dispositivo físico via USB"
  echo ""
  echo "Dica: Execute './start-android.sh' para iniciar o emulador automaticamente"
  exit 1
fi

# Listar dispositivos conectados
echo -e "${BLUE}📱 Dispositivos Android conectados:${NC}"
adb devices | grep -v "List of devices" | grep "device$"
echo ""

# Copiar arquivo para o dispositivo
echo -e "${YELLOW}📤 Copiando arquivo para /sdcard/Download/...${NC}"
adb push "$MOCK_FILE" /sdcard/Download/mock-data.json

echo ""
echo -e "${GREEN}✅ Arquivo copiado com sucesso!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo ""
echo "  1. Abra o app Artemis no dispositivo"
echo "  2. Navegue até: Admin > Importar Dados do Dispositivo"
echo "  3. Selecione o arquivo 'mock-data.json' da pasta Downloads"
echo "  4. Confirme a importação"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️  Aviso:${NC} A importação irá substituir todos os dados existentes!"
echo ""
