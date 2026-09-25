import { defineStore } from 'pinia'
import setting from '@/settings'
export const useTagsViewStore = defineStore('tagsView', {
  state: () => {
    return {
      visitedViews: [] //tag array
    }
  },
  actions: {
    addVisitedView(view) {
      this.$patch((state) => {
        //if the tag being added already exists, return directly
        if (state.visitedViews.some((v) => v.path === view.path)) return
        //if the count exceeds setting.tagsViewNum, replace the last element, otherwise push a new element onto visitedViews
        if (state.visitedViews.length >= setting.tagsViewNum) {
          state.visitedViews.pop()
          state.visitedViews.push(
            Object.assign({}, view, {
              title: view.meta.title || 'no-name'
            })
          )
        } else {
          state.visitedViews.push(
            Object.assign({}, view, {
              title: view.meta.title || 'no-name'
            })
          )
        }
      })
    },
    delVisitedView(view) {
      return new Promise((resolve) => {
        this.$patch((state) => {
          //match the view.path element and remove it
          for (const [i, v] of state.visitedViews.entries()) {
            if (v.path === view.path) {
              state.visitedViews.splice(i, 1)
              break
            }
          }
          resolve([...state.visitedViews])
        })
      })
    },
    delOthersVisitedViews(view) {
      return new Promise((resolve) => {
        this.$patch((state) => {
          state.visitedViews = state.visitedViews.filter((v) => {
            return v.meta.affix || v.path === view.path
          })
          resolve([...state.visitedViews])
        })
      })
    },
    delAllVisitedViews() {
      return new Promise((resolve) => {
        this.$patch((state) => {
          // keep affix tags
          state.visitedViews = state.visitedViews.filter((tag) => tag.meta?.affix)
          resolve([...state.visitedViews])
        })
      })
    }
  }
})
