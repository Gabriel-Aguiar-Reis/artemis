#!/usr/bin/env bash
# brand-apply.sh — Aplica um brand overlay ao projeto
# Uso: ./brand-apply.sh <nome-do-brand>   (padrão: apollo)
#
# O overlay deve estar em brand/<nome>/ com a estrutura:
#   brand.config.js         → copiado para brand.config.js (raiz)
#   files/                  → arquivos que substituem os originais

set -euo pipefail

BRAND="${1:-apollo}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BRAND_DIR="$SCRIPT_DIR/brand/$BRAND"

if [[ ! -d "$BRAND_DIR" ]]; then
  echo "❌  Brand '$BRAND' não encontrado em brand/$BRAND/"
  exit 1
fi

echo "🎨  Aplicando brand '$BRAND'..."

# Ler o nome do app antes de copiar (para usar no log e na limpeza iOS)
APP_NAME=$(node -e "try{console.log(require('$BRAND_DIR/brand.config.js').appName)}catch(e){console.log('Artemis')}")

# 1. Copiar brand.config.js para a raiz (lido por app.config.js)
cp "$BRAND_DIR/brand.config.js" "$SCRIPT_DIR/brand.config.js"

# 2. Sobrescrever arquivos de configuração e assets nativos
rsync -a --exclude='.DS_Store' "$BRAND_DIR/files/" "$SCRIPT_DIR/"

# 3. Limpar pastas iOS do projeto base (Artemis) para evitar conflito no Xcode
#    Elas ficam como 'D' no git (deletadas) — comportamento esperado no estado com brand aplicado
if [[ "$APP_NAME" != "Artemis" ]]; then
  rm -rf \
    "$SCRIPT_DIR/ios/Artemis" \
    "$SCRIPT_DIR/ios/Artemis.xcodeproj" \
    "$SCRIPT_DIR/ios/Artemis.xcworkspace" 2>/dev/null || true
fi

echo "✅  Brand '$BRAND' aplicado com sucesso!"
echo "    → app.config.js lerá o nome: $APP_NAME"
echo "    → Para reverter: ./brand-revert.sh"
