import axiosReq from '@/utils/axios-req'
// export const userInfoReq = (): Promise<any> => {
//   return new Promise((resolve) => {
//     const reqConfig = {
//       url: '/basis-func/user/getUserInfo',
//       params: { plateFormId: 2 },
//       method: 'post'
//     }
//     axiosReq(reqConfig).then(({ data }) => {
//       resolve(data)
//     })
//   })
// }

//Log in
export const loginReq = (subForm) => {
  return axiosReq({
    url: 'api/user/login',
    data: subForm,
    method: 'post'
  })
}

//Log out
export const loginOutReq = () => {
  return axiosReq({
    url: 'api/user/out',
    method: 'post'
  })
}
