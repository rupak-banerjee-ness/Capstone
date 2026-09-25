import router from '@/router'
import {progressClose, progressStart } from '@/hooks/use-permission'
// import { useBasicStore } from '@/store/basic'
import { i18n } from '@/lang/index'

// import settings from "@/settings";

//intercept before route entry
//to: the page about to be entered vue-router4.0 does not recommend using next()
// const whiteList = ['/login', '/404', '/401'] // no redirect whitelist
router.beforeEach(async (to) => {
  progressStart()
  document.title = i18n.global.t(to.meta?.title || 'CrackSQL') // i18 page title

  const basicStore = useBasicStore()
  basicStore.setFilterAsyncRoutes([])
  return true
  // //not login
  // if (!settings.isNeedLogin || to.meta.ignoreLogin) {
  //   basicStore.setFilterAsyncRoutes([])
  //   return true
  // }
  //1. check token
  // if (basicStore.token) {
  //   if (to.path === '/login') {
  //     return '/'
  //   } else {
  //     basicStore.setFilterAsyncRoutes([])
  //     return true
  //   }
  // } else {
  //   if (!whiteList.includes(to.path)) {
  //     return `/login?redirect=${to.path}`
  //   } else {
  //     return true
  //   }
  // }
})
//intercept after route entry
router.afterEach(() => {
  progressClose()
})
