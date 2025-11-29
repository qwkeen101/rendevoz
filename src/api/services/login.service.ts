import { request } from '@/utils/request'
import { IUser, IWebRequest } from '~/typings/data'
import FileSystem from '@/api/fileSystem'
import { decryptData } from '@/utils/crypt'
import UserService from '@/api/services/user.service'
import Interface from '@/api/services/interface'
import toast from 'react-hot-toast'
import { t } from 'i18next'
import trans from '@/consts/trans'

localStorage.removeItem('loginState')

const refreshTokenId = 'rd_rt'
const createLoginService = () => {
  const removeRefreshToken = () => {
    localStorage.removeItem(refreshTokenId)
  }
  const loginWithRefreshToken = async () => {
    const t = localStorage.getItem(refreshTokenId)
    if (!t) return Promise.reject()
    const res = await request<IWebRequest<{ token: string; refreshToken: string }>>(Interface.User() + '/login', {
      data: { rtoken: window.atob(t) },
      method: 'POST'
    })
    UserService.updateLocalUserDetails({ idToken: res.data.result.token, refreshToken: res.data.result.refreshToken })
  }
  const checkEmailExist = (email: string) => {
    return request<
      IWebRequest<{
        exist: boolean
      }>
    >(Interface.Email() + '/checkEmailExist', { params: { email } })
  }
  const sendVerifyEmail = (email: string) => {
    return request(Interface.Email() + '/sendVerifyEmail', { params: { email } })
  }
  const verifyCode = async (code: number, email: string) => {
    const res = await request<IWebRequest<{ token: string }>>(Interface.Email() + '/verifyCode', {
      params: { code, email }
    })
    return res.data.result.token
  }
  // if success return jwtToken
  const login = async (email: string, password: string, token?: string) => {
    const res = await request<IWebRequest<{ token: string; refreshToken: string }>>(Interface.User() + '/login', {
      data: { email, password, token },
      method: 'post'
    })
    UserService.updateLocalUserDetails({ idToken: res.data.result.token, refreshToken: res.data.result.refreshToken })
  }

  const loadUserDetailsFromCache = async (): Promise<IUser> => {
    try {
      if (localStorage.getItem('userDetails')) {
        const cached = localStorage.getItem('userDetails')!
        const mId = await FileSystem.fs.getMachineId()
        if (!mId) return Promise.reject()
        const decrypted = JSON.parse(await decryptData(cached, mId))
        const time = Number(decrypted.lastLogin)
        const d = new Date(time)
        const now = new Date()
        // minus one week
        now.setDate(now.getDate() - 7)
        if (d.getTime() > now.getTime()) {
          console.log(decrypted)
          return decrypted as IUser
        }
      }
    } catch (e) {
      return Promise.reject()
    }
    return Promise.reject()
  }
  // can not use axios client here, or will be infinite loop
  const refreshToken = (): Promise<{
    idToken: string
    refreshToken: string
  }> => {
    return new Promise((res, rej) => {
      const user = UserService.getUser()
      if (user) {
        const { refreshToken } = user
        if (refreshToken) {
          fetch(Interface.User() + '/refreshToken', {
            body: JSON.stringify({ refreshToken }),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })
            .then(i => i.json())
            .then(data => {
              if (data) {
                const { id_token, refresh_token } = data.result
                res({
                  idToken: id_token,
                  refreshToken: refresh_token
                })
              } else {
                rej()
              }
            })
            .catch(e => rej(e))
          return
        } else {
          rej()
        }
      } else {
        rej()
      }
    })
  }

  const sendResetEmail = async (email: string) => {
    const res = await request<IWebRequest<undefined>>(Interface.Email() + '/sendResetEmail', {
      params: { email }
    })
    return res
  }

  const verifyResetCode = async (email: string, code: string) => {
    if (!email || !code) {
      toast.error(t(trans.Errors.InvalidArgs))
      return Promise.reject()
    }
    const res = await request<IWebRequest<{ token: string }>>(Interface.Email() + '/verifyResetCode', {
      params: { email, code }
    })
    return res.data.result.token
  }

  const resetPassword = async (email: string, password: string, token: string) => {
    if (!email || !password || !token) {
      toast.error(t(trans.Errors.InvalidArgs))
      return Promise.reject()
    }
    const res = await request<IWebRequest<{ token: string; refreshToken: string }>>(Interface.Email() + '/resetPassword', {
      data: {
        email,
        password,
        token
      },
      method: 'POST'
    })
    UserService.updateLocalUserDetails({ idToken: res.data.result.token, refreshToken: res.data.result.refreshToken })
  }

  return {
    verifyResetCode,
    sendResetEmail,
    resetPassword,
    sendVerifyEmail,
    verifyCode,
    removeRefreshToken,
    checkEmailExist,
    login,
    refreshToken,
    loadUserDetailsFromCache,
    loginWithRefreshToken
  }
}

const LoginService = createLoginService()

export default LoginService
