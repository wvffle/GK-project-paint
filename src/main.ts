import { createApp } from 'vue'
import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'

// import Funkwhale from '@funkwhale/vui'
import App from './App.vue'
import generatedRoutes from '~pages'
import type { UserModule } from '~/types'

import '@unocss/reset/tailwind.css'
import '@funkwhale/vui/style.css'
import './styles/main.css'
import './styles/index.scss'
import 'uno.css'

// router
const routes = setupLayouts(generatedRoutes)
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const app = createApp(App)

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      vui: {
        'radio': 'Radio',
        'albums': '{n} album | {n} albums',
        'tracks': '{n} track | {n} tracks',
        'episodes': '{n} episode | {n} episodes',
        'by-user': 'by {\'@\'}{username}',
        'go-to': 'Go to',
        'pagination': {
          previous: 'Previous',
          next: 'Next',
        },
        'privacy-level': {
          private: 'private',
          public: 'public',
          pod: 'pod',
        },
      },
    },
  },
})

app.use(i18n)
// app.use(Funkwhale)

app.config.errorHandler = (err) => {
  // eslint-disable-next-line no-alert
  alert((err as Error).message)
}

// install all modules under `modules/`
Object.values(import.meta.glob<{ install: UserModule }>('./modules/*.ts', { eager: true }))
  .forEach(i => i.install?.({ app }))

app.use(router).mount('#app')
