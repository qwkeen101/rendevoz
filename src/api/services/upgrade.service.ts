import { request } from '@/utils/request'
import { IWebRequest } from '~/typings'
import Interface from '@/api/services/interface'

const UpgradeService = {
  upgradeSub: async (method: 'monthly' | 'yearly' | 'lifetime', duration: number) => {
    const result = await request<IWebRequest<{ code: string }>>(Interface.Upgrade(), {
      params: {
        payType: 'subscription',
        duration,
        method
      }
    })
    return result.data.result.code
  }
}

export default UpgradeService
