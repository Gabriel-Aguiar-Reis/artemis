import path from 'node:path'
import { fileURLToPath, URL as NodeURL } from 'node:url'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new NodeURL('.', import.meta.url))

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@': rootDir,
      '@src': path.resolve(rootDir, 'src'),
      'react-native': 'react-native-web',
      'expo-sqlite': path.resolve(rootDir, 'vitest/mocks/expo-sqlite.ts'),
      'drizzle-orm/expo-sqlite': path.resolve(
        rootDir,
        'vitest/mocks/drizzle-expo-sqlite.ts'
      ),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: path.resolve(rootDir, 'vitest.setup.ts'),
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__tests__/**'],
      reportsDirectory: './coverage/unit',
      reporter: ['text', 'lcov', 'html'],
      cleanOnRerun: true,
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  esbuild: {
    loader: 'tsx',
    jsx: 'automatic',
    jsxImportSource: 'react',
    include: [
      /src\/.*\.[tj]sx?$/,
      /node_modules\/react-native-toast-message\/.*\.js$/,
      /vitest\.setup\.ts$/,
      /vitest\/mocks\/.*\.ts$/,
    ],
  },
})
