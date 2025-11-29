import { request } from '@/utils/request'
import Interface from '@/api/services/interface'
import { IWebRequest } from '~/typings'

const CommonService = {
  checkPayOrder: async (orderId: string) => {
    const res = await request<IWebRequest<{ state: 'SUCCESS' | 'CLOSED' | 'NOTPAY' }>>(Interface.CheckPayOrder(), {
      params: {
        orderId
      }
    })
    return res.data.result.state
  }
}

export default CommonService
