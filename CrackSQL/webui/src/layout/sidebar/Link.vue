<template>
  <component :is="type" v-bind="linkProps(to)">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { isExternal } from '@/hooks/use-layout'

const props = defineProps({
  to: { type: String, required: true }
})
//check whether it's an external link, true: use the <a/> tag, false: <router-link/>
const type = computed(() => {
  if (isExternal(props.to)) return 'a'
  return 'router-link'
})
//check whether it's an external link, true: return the <a/> tag jump attributes, false: use the current path directly
const linkProps = (to) => {
  if (isExternal(props.to)) {
    return {
      href: to,
      target: '_blank',
      //using target="_blank" without rel="noopener noreferrer" is a security risk; rel="noopener noreferrer" on <a> tags makes the site safer
      rel: 'noopener'
    }
  }
  return { to }
}
</script>
