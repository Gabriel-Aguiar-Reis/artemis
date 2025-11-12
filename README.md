# Artemis - Sistema de Gerenciamento de Rotas e Ordens de Serviço# Minimal Template

Sistema desenvolvido em React Native com Expo para gerenciar clientes, produtos, ordens de serviço e itinerários de visita.This is a [React Native](https://reactnative.dev/) project built with [Expo](https://expo.dev/) and [React Native Reusables](https://reactnativereusables.com).

## 🚀 FuncionalidadesIt was initialized using the following command:

### ✅ Implementadas```bash

npx @react-native-reusables/cli@latest init -t artemis

- **Gestão de Clientes**: Cadastro completo com endereço e coordenadas GPS```

- **Gestão de Categorias**: Organize produtos por categorias

- **Gestão de Produtos**: Catálogo com preços, validade e categorização## Getting Started

- **Ordens de Serviço**: Crie e gerencie ordens de visita para clientes

- **Itinerário**: Planeje rotas de visita com otimização automáticaTo run the development server:

- **WhatsApp Integration**: Envie detalhes da ordem de serviço via WhatsApp (wa.me)

- **Google Maps Integration**: Gere links para rotas completas ou parciais```bash

- **Reordenação de Rotas**: Ajuste manualmente a ordem das visitas npm run dev

- **Otimização de Rotas**: Algoritmo que calcula a rota mais eficiente # or

- **Cálculo de Distâncias**: Distância entre pontos usando fórmula de Haversine yarn dev

  # or

## 📦 Instalação pnpm dev

    # or

````bash bun dev

# Instale as dependências```

yarn install

This will start the Expo Dev Server. Open the app in:

# Inicie o app

yarn dev- **iOS**: press `i` to launch in the iOS simulator _(Mac only)_

```- **Android**: press `a` to launch in the Android emulator

- **Web**: press `w` to run in a browser

## 🎯 Como Usar

You can also scan the QR code using the [Expo Go](https://expo.dev/go) app on your device. This project fully supports running in Expo Go for quick testing on physical devices.

### 1. Cadastrar Clientes

- Vá em "Clientes" > botão "+"## Adding components

- Preencha nome da loja, contato, telefone e endereço

- **Importante**: Adicione as coordenadas GPS (latitude/longitude) para usar no itinerárioYou can add more reusable components using the CLI:

- Marque se o telefone tem WhatsApp

```bash

### 2. Criar Categoriasnpx react-native-reusables/cli@latest add [...components]

- Vá em "Categorias" > botão "+"```

- Digite o nome da categoria (ex: Fertilizantes, Sementes)

> e.g. `npx react-native-reusables/cli@latest add input textarea`

### 3. Cadastrar Produtos

- Vá em "Produtos" > botão "+"If you don't specify any component names, you'll be prompted to select which components to add interactively. Use the `--all` flag to install all available components at once.

- Preencha nome, categoria, preço e validade

- Validade aceita formatos: "1 year", "6 months", "30 days"## Project Features



### 4. Criar Ordem de Serviço- ⚛️ Built with [Expo Router](https://expo.dev/router)

- Vá em "Ordens de Serviço" > botão "+"- 🎨 Styled with [Tailwind CSS](https://tailwindcss.com/) via [Nativewind](https://www.nativewind.dev/)

- Selecione o cliente- 📦 UI powered by [React Native Reusables](https://github.com/founded-labs/react-native-reusables)

- Escolha método de pagamento e parcelas- 🚀 New Architecture enabled

- 🔥 Edge to Edge enabled

### 5. Gerenciar Itinerário- 📱 Runs on iOS, Android, and Web

- Vá em "Itinerário"

- Use "Otimizar Rota" para calcular o melhor caminho## Learn More

- Reordene manualmente usando as setas ↑↓

- Clique em "Abrir no Maps" para ver a rota completaTo dive deeper into the technologies used:

- Ou clique em "Rota até próximo" para ver apenas um trecho

- [React Native Docs](https://reactnative.dev/docs/getting-started)

### 6. Enviar WhatsApp- [Expo Docs](https://docs.expo.dev/)

- Na listagem de Ordens de Serviço- [Nativewind Docs](https://www.nativewind.dev/)

- Clique no ícone do WhatsApp (verde)- [React Native Reusables](https://reactnativereusables.com)

- A mensagem será gerada automaticamente

## Deploy with EAS

## 🛠️ Tecnologias

The easiest way to deploy your app is with [Expo Application Services (EAS)](https://expo.dev/eas).

- React Native 0.81.5

- Expo 54- [EAS Build](https://docs.expo.dev/build/introduction/)

- Expo Router- [EAS Updates](https://docs.expo.dev/eas-update/introduction/)

- NativeWind (Tailwind CSS)- [EAS Submit](https://docs.expo.dev/submit/introduction/)

- TypeScript

- React Context API---



## 📱 EstruturaIf you enjoy using React Native Reusables, please consider giving it a ⭐ on [GitHub](https://github.com/founded-labs/react-native-reusables). Your support means a lot!


````

artemis/
├── app/ # Telas (Expo Router)
├── src/
│ ├── models/ # Classes de domínio
│ ├── contexts/ # React Contexts
│ └── services/ # WhatsApp e Maps
└── components/ # Componentes UI

```

## 📝 Licença

MIT
```
