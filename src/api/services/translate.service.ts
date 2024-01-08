import { globalStore } from '@/api/stores'
import { request } from '@/utils/request'
import { userAtom } from './login.service'
import { IWebRequest } from '~/typings'
import toast from 'react-hot-toast'
import Interface from '@/api/services/interface'

const TranslateService = {
  // return original text and translated text
  translate: async (query: string, to = 'zh', from?: string) => {
    const result = await request<
      IWebRequest<{
        result: {
          trans: string
          orig: string
        }[]
        monthlyTranslateNum: number
        totalTranslateNum: number
        monthlyTranslateUsed: number
        totalTranslateUsed: number
      }>
    >(Interface.Translate('common'), {
      params: {
        query,
        to,
        from
      },
      method: 'GET'
    })
    if (result.data.status === 'ERROR') {
      toast.error(result.data.message || '')
      throw result.data.message
    }
    const user = globalStore.get(userAtom)
    if (user) {
      const d = result.data.result
      globalStore.set(userAtom, {
        ...user,
        totalTranslateNum: d.totalTranslateNum,
        monthlyTranslateNum: d.monthlyTranslateNum,
        monthlyTranslateUsed: d.monthlyTranslateUsed,
        totalTranslateUsed: d.totalTranslateUsed
      })
    }
    return result.data.result
  },
  textTranslate: async (query: string, to = 'zh', from?: string) => {
    const result = await request<
      IWebRequest<{
        result: string
        monthlyTranslateNum: number
        totalTranslateNum: number
        monthlyTranslateUsed: number
        totalTranslateUsed: number
      }>
    >(Interface.Translate('text'), {
      params: {
        query,
        to,
        from
      },
      method: 'GET'
    })
    if (result.data.status === 'ERROR') {
      toast.error(result.data.message || '')
      throw result.data.message
    }
    const user = globalStore.get(userAtom)
    if (user) {
      const d = result.data.result
      globalStore.set(userAtom, {
        ...user,
        totalTranslateNum: d.totalTranslateNum,
        monthlyTranslateNum: d.monthlyTranslateNum,
        monthlyTranslateUsed: d.monthlyTranslateUsed,
        totalTranslateUsed: d.totalTranslateUsed
      })
    }
    return result.data.result.result
  }
}

export default TranslateService
