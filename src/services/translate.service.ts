import { globalStore } from '@/stores'
import { request } from '@/utils/request'
import { userAtom } from './login.service'

const localTranslateInterface = 'http://localhost:9000/translate'
const remoteTranslateInterface = 'https://api.rendevoz.com/translate'
const TranslateService = {
  translate: async (query: string, to = 'zh', from?: string) => {
    const result = await request<{
      result: {
        trans: string
        orig: string
      }[]
      monthlyTranslateNum: number
      totalTranslateNum: number
      monthlyTranslateUsed: number
      totalTranslateUsed: number
    }>(remoteTranslateInterface, {
      params: {
        query,
        to,
        from
      },
      method: 'GET'
    })
    const user = globalStore.get(userAtom)
    if (user) {
      const d = result.data
      globalStore.set(userAtom, {
        ...user,
        totalTranslateNum: d.totalTranslateNum,
        monthlyTranslateNum: d.monthlyTranslateNum,
        monthlyTranslateUsed: d.monthlyTranslateUsed,
        totalTranslateUsed: d.totalTranslateUsed
      })
    }
    return result.data
  }
}

export default TranslateService
