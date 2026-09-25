import * as AllComponent from 'element-plus'
// on-demand imports in element-plus can slow down first load
const elementPlusComponentNameArr = ['ElButton']
export default function (app) {
  elementPlusComponentNameArr.forEach((component) => {
    app.component(component, AllComponent[component])
  })
}
