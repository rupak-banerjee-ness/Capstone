/**
 * Check whether a path is an external link
 * @param {string} path
 * @returns {Boolean}
 */
import { onBeforeMount, onBeforeUnmount, onMounted } from 'vue'
import { useBasicStore } from '@/store/basic'
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/* judge window size changes to control sidebar collapse/expand */
export function resizeHandler() {
  const { body } = document
  const WIDTH = 992
  const basicStore = useBasicStore()
  const isMobile = () => {
    const rect = body.getBoundingClientRect()
    return rect.width - 1 < WIDTH
  }
  const resizeHandler = () => {
    if (!document.hidden) {
      if (isMobile()) {
        /*此处只做根据window尺寸关闭sideBar功能*/
        basicStore.setSidebarOpen(false)
      } else {
        basicStore.setSidebarOpen(true)
      }
    }
  }
  onBeforeMount(() => {
    window.addEventListener('resize', resizeHandler)
  })
  onMounted(() => {
    if (isMobile()) {
      basicStore.setSidebarOpen(false)
    } else {
      basicStore.setSidebarOpen(true)
    }
  })
  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeHandler)
  })
}
