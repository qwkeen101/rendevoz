import { request } from '@/utils/request'
import { IWebRequest } from '~/typings'
import Interface from '@/api/services/interface'

const UpgradeService = {
  upgradeSub: async (method: 'monthly' | 'yearly' | 'lifetime') => {
    const result = await request<IWebRequest<{ code: string; orderId: string }>>(Interface.Upgrade(), {
      params: {
        payType: 'subscription',
        method
      }
    })
    return result.data.result
  }
}

export default UpgradeService
