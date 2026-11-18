#!/usr/bin/env bash
# brand-revert.sh — Reverte o projeto para o brand base (Artemis)
# Uso: ./brand-revert.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔄  Revertendo para brand base (Artemis)..."

# 0. Ler o nome do brand atual ANTES de remover brand.config.js
CURRENT_BRAND_APP=$(node -e "try{console.log(require('./brand.config.js').appName)}catch(e){console.log('')}" 2>/dev/null || echo "")

# 1. Remover brand.config.js da raiz (app.config.js volta ao padrão Artemis)
rm -f brand.config.js

# 2. Restaurar arquivos de configuração de texto rastreados pelo git
git checkout -- \
  android/app/src/main/res/values/strings.xml \
  android/settings.gradle \
  ios/Podfile \
  src/assets/images/icon.png \
  src/assets/images/adaptive-icon.png \
  src/assets/images/favicon.png \
  src/assets/images/splash.png \
  src/assets/images/artemis.png \
  src/assets/mock-data.json

# 3. Restaurar ícones Android rastreados
for SIZE in hdpi mdpi xhdpi xxhdpi xxxhdpi; do
  git checkout -- \
    "android/app/src/main/res/mipmap-$SIZE/ic_launcher.webp" \
    "android/app/src/main/res/mipmap-$SIZE/ic_launcher_foreground.webp" \
    "android/app/src/main/res/mipmap-$SIZE/ic_launcher_round.webp" \
    "android/app/src/main/res/drawable-$SIZE/splashscreen_logo.png"
done

# 4. Restaurar arquivos iOS deletados (Artemis.xcodeproj, Artemis/, etc.)
git checkout -- ios/Artemis ios/Artemis.xcodeproj ios/Artemis.xcworkspace 2>/dev/null || true

# 5. Remover arquivos não-rastreados do brand atual (ex: ios/Apollo/)
#    (apenas pastas que sabemos que são do overlay — não remove nada do repo base)
if [[ -n "$CURRENT_BRAND_APP" && "$CURRENT_BRAND_APP" != "Artemis" ]]; then
  rm -rf "ios/$CURRENT_BRAND_APP" "ios/$CURRENT_BRAND_APP.xcodeproj" 2>/dev/null || true
fi

echo "✅  Revertido para Artemis com sucesso!"
echo "    → Para aplicar um brand: ./brand-apply.sh <nome>"
