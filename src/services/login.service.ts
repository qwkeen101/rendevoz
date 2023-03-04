import { useGlobalAtom } from '@/jotai/jotaiScope'
import { globalStore } from '@/stores'
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
const userAtom = atom<IUser | null>(null)

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
    return request(remoteInterface + '/verifyCode', { params: { code, email } })
  }
  const verifyUser = (options: VerifyUserOptions) => {
    const { type } = options
    switch (type) {
      case 'email': {
        const { email } = options
        return request<IUser>(remoteInterface + '/verifyUser', { params: { type, email } })
      }
      case 'uid': {
        const { uid } = options
        return request<IUser>(remoteInterface + '/verifyUser', { params: { type, uid } })
      }
    }
  }
  const login = (email: string, password: string) => {
    return request(remoteInterface + '/login', { data: { email, password }, method: 'post' })
  }
  return {
    sendVerifyEmail,
    verifyCode,
    verifyUser,
    checkEmailExist,
    login
  }
}

const LoginService = createLoginService()

export default LoginService
