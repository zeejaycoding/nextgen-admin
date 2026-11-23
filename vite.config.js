import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function buildVersion() {
  return {
    name: 'build-version',
    closeBundle() {
      const dist = resolve(process.cwd(), 'dist')
      const version = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      writeFileSync(resolve(dist, 'version.json'), JSON.stringify({ version }))
    },
  }
}

export default defineConfig({
  plugins: [react(), buildVersion()],
  server: {
    port: 5174,
    open: false,
  },
})
