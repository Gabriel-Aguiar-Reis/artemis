import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/infra/db/drizzle/schema',
  out: './src/infra/db/drizzle',
})
