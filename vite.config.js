import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

// `npm run gsm` start een HTTPS server op je wifi netwerk,
// zodat de camera ook werkt als je de app op je gsm opent.
export default defineConfig(({ mode }) => ({
  plugins: [vue(), ...(mode === 'gsm' ? [basicSsl()] : [])],
  server: { host: mode === 'gsm' },
}))
