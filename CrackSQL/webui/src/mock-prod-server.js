import { createProdMockServer } from 'vite-plugin-mock/es/createProdMockServer'
//https://cn.vitejs.dev/guide/features.html#glob-import
const modulesFiles = import.meta.glob('../mock/*', { eager: true })
let modules = []
for (const filePath in modulesFiles) {
  // read file contents into modules
  modules = modules.concat(modulesFiles[filePath].default)
}
export function setupProdMockServer() {
  // create prod mock server
  createProdMockServer([...modules])
}
