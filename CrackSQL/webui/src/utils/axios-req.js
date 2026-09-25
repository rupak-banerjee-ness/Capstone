import axios from 'axios'
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus'
import { useBasicStore } from '@/store/basic'

//create an axios request instance with axios.create()
const service = axios.create()
let loadingInstance = null //loading instance
let tempReqUrlSave = ''
let authorTipDoor = true

const noAuthDill = () => {
  authorTipDoor = false
  ElMessageBox.confirm('Please log in again', {
    confirmButtonText: 'Log in again',
    closeOnClickModal: false,
    showCancelButton: false,
    showClose: false,
    type: 'warning'
  }).then(() => {
    useBasicStore().resetStateAndToLogin()
    authorTipDoor = true
  })
}

//intercept before request
service.interceptors.request.use(
  (req) => {
    const { token, axiosPromiseArr } = useBasicStore()
    //axiosPromiseArr collects request URLs, used for cancelling requests
    req.cancelToken = new axios.CancelToken((cancel) => {
      tempReqUrlSave = req.url
      axiosPromiseArr.push({
        url: req.url,
        cancel
      })
    })

    //set token in the header
    if (token) req.headers['Authorization'] = token
    //if req.method is get, set the request params as ?name=xxx
    if ('get'.includes(req.method?.toLowerCase()) && !req.params) req.params = req.data

    //req loading
    // @ts-ignore
    if (req.reqLoading ?? true) {
      loadingInstance = ElLoading.service({
        lock: true,
        fullscreen: true,
        // spinner: 'CircleCheck',
        text: 'Loading data...',
        background: 'rgba(0, 0, 0, 0.1)'
      })
    }
    return req
  },
  (err) => {
    //request failed to send
    Promise.reject(err)
  }
)
//intercept after response
service.interceptors.response.use(
  (res) => {

    //cancel request
    useBasicStore().remotePromiseArrByReqUrl(tempReqUrlSave)
    if (loadingInstance) {
      loadingInstance && loadingInstance.close()
    }
    //download file
    if (res.data?.type?.includes("sheet")) {
      return res
    }

    if (res.config.type === 'chat') {
      return res.data
    }

    const { code, msg } = res.data
    const successCode = [0,200,20000]
    const noAuthCode = []
    if (successCode.includes(code)) {
      return res.data
    } else {
      //authorTipDoor prevents multiple requests from alerting multiple times
      if (authorTipDoor) {
        if (noAuthCode.includes(code)) {
          noAuthDill()
        } else {
          // @ts-ignore
          if (!res.config?.isNotTipErrorMsg) {
            ElMessage.error({
              message: msg,
              duration: 2 * 1000
            })
          } else {
            return res
          }
          return Promise.reject(msg)
        }
      }
    }
  },
  //error handling on response
  (err) => {
    //cancel request
    useBasicStore().remotePromiseArrByReqUrl(tempReqUrlSave)
    if (loadingInstance) {
      loadingInstance && loadingInstance.close()
    }
    ElMessage.error({
      message: err,
      duration: 2 * 1000
    })
    return Promise.reject(err)
  }
)
//export the service instance for pages to call , config->page config
export default function axiosReq(config) {
  return service({
    baseURL: import.meta.env.VITE_APP_BASE_URL,
    timeout: 12000,
    ...config
  })
}
