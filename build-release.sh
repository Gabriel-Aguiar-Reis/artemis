#!/bin/bash

# Script para gerar build local de release do Artemis
# Uso: ./build-release.sh

set -e

echo "🚀 Iniciando build de release do Artemis..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurar Java 17 para o build
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
echo "☕ Usando Java 17: $JAVA_HOME"
echo ""

# Verificar se as senhas estão configuradas
if ! grep -q "your_store_password_here" android/gradle.properties 2>/dev/null || ! grep -q "your_key_password_here" android/gradle.properties 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Senhas da keystore configuradas"
else
    echo -e "${YELLOW}⚠${NC}  ATENÇÃO: Você precisa editar android/gradle.properties e substituir:"
    echo "   - your_store_password_here pela senha da keystore"
    echo "   - your_key_password_here pela senha da key"
    echo ""
    read -p "Pressione Enter para continuar ou Ctrl+C para cancelar..."
fi

echo ""
echo "1️⃣  Preparando build..."

# Regenerar assets nativos a partir dos assets do Expo
echo ""
echo "🎨 Regenerando assets nativos (ícones, splash screen)..."
npx expo prebuild --clean --no-install

# Restaurar local.properties após o prebuild (ele é removido pelo --clean)
echo ""
echo "⚙️  Restaurando configuração do Android SDK..."
cat > android/local.properties << EOF
# Este arquivo foi gerado automaticamente pelo build-release.sh
# Não edite manualmente - ele é recriado a cada build
sdk.dir=$HOME/Library/Android/sdk
EOF

cd android

# Limpeza preventiva de cache de autolinking e Gradle
echo ""
echo "🧹 Limpando caches (autolinking/Gradle)..."
rm -rf build/generated/autolinking || true
./gradlew clean || true

echo ""
echo "2️⃣  Gerando bundle de release (AAB)..."
./gradlew bundleRelease

echo ""
echo "3️⃣  Gerando APK de release..."
./gradlew assembleRelease

echo ""
echo -e "${GREEN}✅ Build concluída com sucesso!${NC}"
echo ""
echo "📦 Arquivos gerados:"
echo "   APK: android/app/build/outputs/apk/release/app-release.apk"
echo "   AAB: android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "💡 Dicas:"
echo "   - Use o AAB para publicar na Play Store"
echo "   - Use o APK para instalação direta ou testes"
echo ""
