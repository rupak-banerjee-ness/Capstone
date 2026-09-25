import { createI18n } from 'vue-i18n'
import en from './en'
import settings from '@/settings'
const messages = { en }

const localeData = {
  globalInjection: true, // if true, the $t() function is registered globally
  legacy: false, // must be false to use in composition api
  locale: settings.defaultLanguage,
  messages // set locale messages
}

export const i18n = createI18n(localeData)
export const setupI18n = {
  install(app) {
    app.use(i18n)
  }
}
