import { useGlobalAtom, useGlobalAtomValue } from '@/hooks/jotai'
import { globalStore } from '@/api/stores'
import { request } from '@/utils/request'
import { atom } from 'jotai'
import { IUser } from '~/typings/data'
import FileSystem from '@/api/fileSystem'
import { decryptData, encryptData } from '@/utils/crypt'

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

const cacheUserDetails = () => {
  setTimeout(async () => {
    const u = getUser()
    if (u) {
      const n: IUser & { lastLogin?: number } = { ...u, lastLogin: Date.now() }
      const mId = await FileSystem.fs.getMachineId()
      if (!mId) return
      const encrypted = await encryptData(JSON.stringify(n), mId)
      localStorage.setItem('userDetails', encrypted)
    }
  }, 200)
}
export const useUser = () => useGlobalAtom(userAtom)

export const useIsUserPro = (includeLifetime?: boolean) => {
  const u = useGlobalAtomValue(userAtom)
  if (!u) return false
  if (includeLifetime && u.lifetimePro) return true
  if (u.premiumEndDate && u.premiumEndDate > Date.now()) return true
  return false
}
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
  const getUserDetails = async (email: string, token: string) => {
    const res = await request<IUser>(remoteInterface + '/userDetails', {
      params: { email },
      headers: { 'x-token': token }
    })
    if (res.data) {
      cacheUserDetails(res.data)
    }
    return res
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

  const updateUserDetails = async (user: Partial<IUser>) => {
    const res = await request<IUser>(remoteInterface + '/updateUser', {
      headers: {
        'x-auth-token': getUser()?.idToken || ''
      },
      data: {
        user
      },
      method: 'POST'
    })
    if (res.data) {
      cacheUserDetails(res.data)
    }
    return res
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
          fetch(remoteInterface + '/refreshToken', {
            body: JSON.stringify({ refreshToken }),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })
            .then(i => i.json())
            .then(data => {
              if (data) {
                const { id_token, refresh_token } = data
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
    updateUserDetails,
    loadUserDetailsFromCache
  }
}

const LoginService = createLoginService()

export default LoginService
