import { useI18n as vueUseI18n } from 'vue-i18n'

// create a cached variable to store the i18n instance
let i18nInstance = null

export const useI18n = () => {
  if (!i18nInstance) {
    i18nInstance = vueUseI18n()
  }
  return i18nInstance
}

// export a convenience translation method
export const t = (key: string) => {
  const i18n = useI18n()
  return i18n.t(key)
} 