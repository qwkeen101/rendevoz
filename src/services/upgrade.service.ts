import { useGlobalAtom } from '@/hooks/jotai'
import { globalStore } from '@/stores'
import { request } from '@/utils/request'
import { atom } from 'jotai'
import { IUser } from '~/typings/data'

const localTranslateInterface = 'http://localhost:9000/pay'
const remoteTranslateInterface = 'https://api.rendevoz.com/pay'
const UpgradeService = {
  upgradeSub: async (method: 'monthly' | 'yearly', duration: number) => {
    const result = await request<string>(remoteTranslateInterface, {
      params: {
        payType: 'subscription',
        duration
      }
    })
    return result.data
  }
}

export default UpgradeService
