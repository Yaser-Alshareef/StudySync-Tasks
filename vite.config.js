import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
    vapidKey: env.VITE_VAPID_KEY,
  }

  return {
    plugins: [
      react(),
      {
        name: 'inject-firebase-config-sw',
        buildStart() {
          if (!firebaseConfig.apiKey) {
            console.warn('⚠️  VITE_FIREBASE_API_KEY not found. Service worker will have empty config.')
            return
          }
          
          const swPath = resolve(process.cwd(), 'public/firebase-messaging-sw.js')
          let swContent = readFileSync(swPath, 'utf-8')
          const configString = JSON.stringify(firebaseConfig, null, 2)
          
          swContent = swContent.replace(
            /const firebaseConfig = \{[\s\S]*?\};/,
            `const firebaseConfig = ${configString};`
          )
          
          writeFileSync(swPath, swContent, 'utf-8')
          console.log('✅ Firebase config injected into service worker')
        }
      }
    ],
    server: {
      port: 3000,
      open: true
    }
  }
})

