import { request } from '@/utils/request'
import { IUser, IWebRequest } from '~/typings'
import toast from 'react-hot-toast'
import Interface from '@/api/services/interface'
import { globalStore } from '@/api/stores'
import LoginService, { cacheUserDetails, userAtom } from '@/api/services/login.service'

const UserService = {
  updateLocalUserDetails: (u: Partial<IUser>) => {
    const c = globalStore.get(userAtom)
    const newUser = Object.assign({}, c, u)
    globalStore.set(userAtom, newUser)
    cacheUserDetails()
  },
  getUserDetails: async () => {
    const res = await request<IWebRequest<IUser>>(Interface.User(), {
      method: 'GET'
    })
    if (res.data.status === 'ERROR') {
      toast.error(res.data.message || 'Failed to get user details!')
      throw ''
    } else {
      UserService.updateLocalUserDetails(res.data.result)
      return res.data.result
    }
  },
  resetPassword: async (password: string) => {
    const res = await request<IWebRequest<undefined>>(Interface.User() + '/resetPassword', {
      method: 'POST',
      data: {
        password
      }
    })
    if (res.data.status === 'ERROR') {
      toast.error(res.data.message || 'Failed to reset password!')
      throw ''
    }
  }
}

export default UserService
