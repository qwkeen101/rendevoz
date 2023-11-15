import { useGlobalAtom } from '@/hooks/jotai'
import { globalStore } from '@/api/stores'
import { request } from '@/utils/request'
import { atom } from 'jotai'
import { IUser } from '~/typings/data'

const remoteInterface = 'https://api.rendevoz.com'
type VerifyUserOptions =
  | {
      type: 'email'
      email: string
    }
  | {
      type: 'uid'
      uid: string
    }

export const userAtom = atom<IUser | null>(
  import.meta.env.PROD
    ? null
    : {
        displayName: 'Administrator',
        isPremium: true,
        premiumEndDate: Date.now() + 10000000000
      }
)

export const useUser = () => useGlobalAtom(userAtom)
export const getUser = () => {
  const user = globalStore.get(userAtom)
  return user
}
const createLoginService = () => {
  const checkEmailExist = (email: string) => {
    return request<{
      exist: boolean
      signInMethods?: string[]
    }>(remoteInterface + '/checkEmailExist', { params: { email } })
  }
  const sendVerifyEmail = (email: string) => {
    return request(remoteInterface + '/sendVerifyEmail', { params: { email } })
  }
  const verifyCode = (code: number, email: string) => {
    return request(remoteInterface + '/verifyCode', {
      params: { code, email }
    })
  }
  const verifyUser = (options: VerifyUserOptions) => {
    const { type } = options
    switch (type) {
      case 'email': {
        const { email } = options
        return request<IUser>(remoteInterface + '/verifyUser', {
          params: { type, email }
        })
      }
      case 'uid': {
        const { uid } = options
        return request<IUser>(remoteInterface + '/verifyUser', {
          params: { type, uid }
        })
      }
    }
  }
  // if success return jwtToken
  const login = (email: string, password: string) => {
    return request<{ token: string }>(remoteInterface + '/login', {
      data: { email, password },
      method: 'post'
    })
  }
  const getUserDetails = (email: string, token: string) => {
    return request<IUser>(remoteInterface + '/userDetails', {
      params: { email },
      headers: { 'x-token': token }
    })
  }

  const updateUserDetails = (user: Partial<IUser>) => {
    return request<IUser>(remoteInterface + '/updateUser', {
      headers: {
        'x-auth-token': getUser()?.idToken || ''
      },
      data: {
        user
      },
      method: 'POST'
    })
  }

  const refreshToken = (): Promise<{
    idToken: string
    refreshToken: string
  }> => {
    return new Promise((res, rej) => {
      const user = getUser()
      if (user) {
        const { refreshToken } = user
        if (refreshToken) {
          request(remoteInterface + '/refreshToken', {
            data: { refreshToken },
            method: 'POST'
          })
            .then(data => {
              if (data.data) {
                const { id_token, refresh_token } = data.data
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
  return {
    sendVerifyEmail,
    verifyCode,
    verifyUser,
    checkEmailExist,
    login,
    getUserDetails,
    refreshToken,
    updateUserDetails
  }
}

const LoginService = createLoginService()

export default LoginService
