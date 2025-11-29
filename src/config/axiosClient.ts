import LoginService from '@/api/services/login.service'
import axios from 'axios'
import jwt_decode from 'jwt-decode'
import UserService from '@/api/services/user.service'

axios.defaults.withCredentials = false
const fetchClient = () => {
  const instance = axios.create()
  instance.interceptors.request.use(async request => {
    const token = await getAuthToken()
    request.headers = {
      ...request.headers,
      'x-auth-token': token
    }
    return request
  })
  return instance
}

export const getAuthToken = async () => {
  const user = UserService.getUser()
  if (user?.idToken) {
    try {
      const decoded = jwt_decode(user.idToken)
      if (decoded && decoded.exp) {
        if (decoded.exp < Number(String(Date.now()).slice(0, 10))) {
          const user = UserService.getUser()
          if (user) {
            const { refreshToken } = user
            if (refreshToken) {
              return new Promise(res => {
                LoginService.refreshToken().then(({ idToken, refreshToken }) => {
                  UserService.updateLocalUserDetails({
                    idToken,
                    refreshToken
                  })
                  res(idToken)
                })
              })
            }
          }
        } else {
          return user.idToken
        }
      }
    } catch (e) {}
  }
}
export default fetchClient()
