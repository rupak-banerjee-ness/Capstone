<template>
  <div>The vue3 recommended template can be integrated into your vscode or webstorm to help speed up development</div>
</template>

<script setup>
// get store and router

const props = defineProps({
  name: {
    require: true,
    default: 'fai',
    type: String
  }
})
const state = reactive({
  levelList: null
})

const routes = computed(() => 'value')
watch(
    () => props.name,
    (oldValue, newValue) => {
    },
    {immediate: true}
)

const router = useRouter()
onMounted(() => {
  console.log('page mounted')
})
const helloFunc = () => {
  console.log('helloFunc')
}
// export for use by the parent element
defineExpose({helloFunc})
// export properties for use in the page
const {levelList} = toRefs(state)
</script>

<style scoped lang="scss"></style>
