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
  },
  localTranslate: async (query: string, to = 'zh', from?: string) => {
    authCu.token = await fetch('https://edge.microsoft.com/translate/auth').then(res => res.text())
    return await MicrosoftTranslate(query)
  }
}
const authCu = {
  token: '',
  fetched: Date.now()
}
const MicrosoftTranslate = async (query: string) => {
  const result = await fetch(
    'https://api-edge.cognitive.microsofttranslator.com/translate?from=&to=zh-Hans&api-version=3.0&includeSentenceLength=true',
    {
      method: 'POST',
      body: JSON.stringify([{ Text: query }]),
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${authCu.token}`
      }
    }
  ).then(res => res.json())
  return result[0].translations[0].text
}

export default TranslateService
