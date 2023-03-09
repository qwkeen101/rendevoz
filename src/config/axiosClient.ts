import LoginService, { getUser, userAtom } from '@/services/login.service'
import { globalStore } from '@/stores'
import axios from 'axios'
import jwt_decode from 'jwt-decode'
import { toast } from 'react-hot-toast'

axios.defaults.withCredentials = false
const fetchClient = () => {
  const instance = axios.create()
  instance.interceptors.request.use(request => {
    if (request.headers?.['x-auth-token']) {
      const idToken = request.headers['x-auth-token'] as string
      try {
        const decoded = jwt_decode(idToken)
        if (decoded && decoded.exp) {
          if (decoded.exp < Number(String(Date.now()).slice(0, 10))) {
            const user = getUser()
            if (user) {
              const { refreshToken } = user
              if (refreshToken) {
                return new Promise(res => {
                  LoginService.refreshToken().then(({ idToken, refreshToken }) => {
                    console.log('ger hter')
                    request.headers = {
                      ...request.headers,
                      'x-auth-token': idToken
                    }
                    console.log('ger we2')
                    globalStore.set(userAtom, {
                      ...user,
                      idToken,
                      refreshToken
                    })
                    res(request)
                  })
                })
              }
            }
          }
        } else {
          toast.error('Unaccepted Request!')
          return
        }
      } catch (e) {
        toast.error('TOKEN IS REQUIRED!')
      }
    }
    // request.headers.RendevozCsrf = Cookies.get('CSRF-TOKEN')
    return request
  })
  return instance
}
export default fetchClient()

// if (options.headers?.['x-auth-token']) {
//   const idToken = options.headers['x-auth-token'] as string
//   const decoded = jwt.decode(idToken, {
//     json: true
//   })
//   if (decoded && decoded.exp) {
//     if (decoded.exp < Date.now()) {

//     }
//   } else {
//     toast.error('Unaccepted Request!')
//     return
//   }
// }
