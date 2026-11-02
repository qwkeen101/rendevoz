import { request } from '@/utils/request'
import { IUser, IWebRequest } from '~/typings'
import Interface from '@/api/services/interface'
import { globalStore } from '@/api/stores'
import { useGlobalAtom, useGlobalAtomValue } from '@/hooks'
import { atom } from 'jotai/index'
import FileSystem from '@/api/fileSystem'
import { encryptData } from '@/utils/crypt'
import LoginService from '@/api/services/login.service'
import { OFFICIAL_BACKEND_ENABLED } from '@/config/backend'

const userAtom = atom<IUser | null>(
  import.meta.env.PROD
    ? null
    : {
        displayName: 'Administrator',
        isPremium: true,
        premiumEndDate: Date.now() + 10000000000
      }
)
const UserService = {
  logout: () => {
    globalStore.set(userAtom, null)
    localStorage.removeItem('userDetails')
    LoginService.removeRefreshToken()
  },
  logoutOfAllDevices: async () => {
    await request<IWebRequest<undefined>>(Interface.User() + '/logout')
    UserService.logout()
  },
  deleteUser: async () => {
    const user = UserService.getUser()
    if (!user?.uid) return Promise.reject()
    await request<IWebRequest<undefined>>(Interface.User(), {
      method: 'DELETE'
    })
    UserService.logout()
  },
  autoLogined: false,
  isUserPro: (includeLifetime?: boolean) => {
    // No account server means nobody can subscribe, so nothing stays locked.
    if (!OFFICIAL_BACKEND_ENABLED) return true
    const u = UserService.getUser()
    if (!u) return false
    if (includeLifetime && u.lifetimePro) return true
    if (u.premiumEndDate && u.premiumEndDate > Date.now()) return true
    return false
  },
  useIsUserPro: (includeLifetime?: boolean) => {
    useGlobalAtomValue(userAtom)
    return UserService.isUserPro(includeLifetime)
  },
  useIsUserLifetime: () => {
    const u = useGlobalAtomValue(userAtom)
    return u?.lifetimePro === true
  },
  getUser: () => {
    const user = globalStore.get(userAtom)
    return user
  },
  useUser: () => useGlobalAtom(userAtom),
  updateLocalUserDetails: (u: Partial<IUser>) => {
    const c = globalStore.get(userAtom)
    const newUser = Object.assign({}, c, u)
    globalStore.set(userAtom, newUser)
    UserService.cacheUserDetails()
    if (u.refreshToken) {
      localStorage.setItem('rd_rt', window.btoa(u.refreshToken))
    }
  },
  cacheUserDetails: () => {
    setTimeout(async () => {
      const u = UserService.getUser()
      if (u) {
        const n: IUser & { lastLogin?: number } = { ...u, lastLogin: Date.now() }
        const mId = await FileSystem.fs.getMachineId()
        if (!mId) return
        const encrypted = await encryptData(JSON.stringify(n), mId)
        localStorage.setItem('userDetails', encrypted)
      }
    }, 200)
  },
  updateUserDetails: async (user: Partial<IUser>) => {
    const res = await request<IWebRequest<undefined>>(Interface.User(), {
      data: {
        user
      },
      method: 'POST'
    })
    UserService.updateLocalUserDetails(user)
    return res
  },
  getUserDetails: async () => {
    const res = await request<IWebRequest<IUser>>(Interface.User(), {
      method: 'GET'
    })
    UserService.updateLocalUserDetails(res.data.result)
    return res.data.result
  },
  updatePassword: async (currentPassword: string, newPassword: string) => {
    const res = await request<IWebRequest<{ token: string; refreshToken: string }>>(Interface.User() + '/updatePassword', {
      data: {
        currentPassword,
        newPassword
      },
      method: 'POST'
    })
    UserService.updateLocalUserDetails({ idToken: res.data.result.token, refreshToken: res.data.result.refreshToken })
  },
  updateEmail: async (email: string, token: string) => {
    const res = await request<IWebRequest<{ token: string; refreshToken: string }>>(Interface.User() + '/updateEmail', {
      params: {
        email,
        token
      }
    })
    UserService.updateLocalUserDetails({ email, idToken: res.data.result.token, refreshToken: res.data.result.refreshToken })
    localStorage.setItem('email', email)
    return
  },
  resetPasswordEmail: async (email: string) => {
    const result = await request<IWebRequest<string>>(Interface.User() + '/resetPassword', {
      params: {
        email
      }
    })
    return result.data.result
  }
}

export default UserService
