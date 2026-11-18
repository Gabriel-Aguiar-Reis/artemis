#!/bin/bash

# Configurar variáveis de ambiente do Android
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# Verificar se há dispositivos conectados
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)

if [ $DEVICES -eq 0 ]; then
  echo "📱 Nenhum dispositivo encontrado. Iniciando emulador..."
  
  # Iniciar emulador em background
  $ANDROID_HOME/emulator/emulator -avd Medium_Phone_API_36.1 > /dev/null 2>&1 &
  
  # Aguardar emulador ficar online
  echo "⏳ Aguardando emulador inicializar..."
  adb wait-for-device
  
  # Aguardar o boot completo
  while [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do
    sleep 1
  done
  
  echo "✅ Emulador pronto!"
fi

# Iniciar o Expo
expo start -c --android
