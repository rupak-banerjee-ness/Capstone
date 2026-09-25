import { defineStore } from 'pinia'
import { langTitle } from '@/hooks/use-common'
import settings from '@/settings'
import { toggleHtmlClass } from '@/theme/utils'
import router from '@/router'
export const useConfigStore = defineStore('config', {
  state: () => {
    return {
      theme: settings.defaultTheme,
      size: settings.defaultSize
    }
  },
  persist: {
    storage: localStorage,
    paths: ['theme', 'size']
  },
  actions: {
    setTheme(data) {
      this.theme = data
      toggleHtmlClass(data)
    },
    setSize(data) {
      this.size = data
    },
    setPageTitle(title) {
      const route = router.currentRoute
      document.title = langTitle(title ?? route.value.meta?.title) // i18n page title
    }
  }
})
