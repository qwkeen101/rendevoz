import { askJSONDocument } from '@/api/services/ai/question'
import toast from 'react-hot-toast'
import { request } from '@/utils/request'
import { IWebRequest } from '~/typings'
import Interface from '@/api/services/interface'

export const CreditToYuan = {
  2000: 10,
  5000: 25,
  11500: 50,
  24000: 100
}

const freeChargeAICredit = async () => {
  await request(Interface.AI('addCredit'), {
    method: 'get'
  })
}
// return weixin QR code
const buyAICredit = async (credit: keyof typeof CreditToYuan): Promise<string> => {
  if (CreditToYuan[credit]) {
    return (
      await request<IWebRequest<{ code: string }>>(Interface.AI('buyCredit'), {
        method: 'GET',
        params: {
          currency: 'yuan',
          amount: credit
        }
      })
    ).data.result.code
  }
  toast.error('Can not buy credit!')
  return Promise.reject()
}

const AIService = {
  askJSONDocument,
  buyAICredit,
  freeChargeAICredit
}

export default AIService
