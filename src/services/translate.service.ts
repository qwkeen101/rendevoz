import { request } from '@/utils/request'

const localTranslateInterface = 'http://localhost:9000/translate'
const TranslateService = {
  translate: async (query: string, to = 'zh', from?: string) => {
    const result = await request<{
      result: string[]
    }>(localTranslateInterface, {
      params: {
        query,
        to,
        from
      },
      method: 'GET'
    })
    return result.data
  }
}

export default TranslateService
