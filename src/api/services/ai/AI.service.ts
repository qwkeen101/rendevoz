import toast from 'react-hot-toast'
import { request } from '@/utils/request'
import { IWebRequest } from '~/typings'
import Interface from '@/api/services/interface'
import { GlobalSetting } from '@/core'
import trans from '@/consts/trans'
import { t } from 'i18next'
import uploadAndTranscribe from '@/api/services/ai/uploadAndTranscribe'
import UserService from '@/api/services/user.service'
import { OFFICIAL_BACKEND_ENABLED } from '@/config/backend'
import { chatStreamStandard, chatStructuredStandard } from './chatStandard'
export const CreditToYuan = {
  200: 1,
  1200: 6,
  2400: 12,
  9800: 48,
  19800: 98,
  39800: 198
}

const freeChargeAICredit = async () => {
  await request(Interface.AI('addCredit'), {
    method: 'get'
  })
}
// return weixin QR code
const buyAICredit = async (
  credit: keyof typeof CreditToYuan
): Promise<{
  code: string
  orderId: string
}> => {
  if (CreditToYuan[credit]) {
    const res = await request<IWebRequest<{ code: string; orderId: string }>>(Interface.AI('buyCredit'), {
      method: 'GET',
      params: {
        currency: 'yuan',
        amount: credit
      }
    })
    return {
      code: res.data.result.code,
      orderId: res.data.result.orderId
    }
  }
  toast.error(t(trans.Errors.InvalidArgs))
  return Promise.reject()
}

const hasTranscript = async (url: string) => {
  try {
    if (OFFICIAL_BACKEND_ENABLED && UserService.isUserPro(true)) {
      await request(Interface.AI('hasTranscript'), {
        params: {
          url
        }
      })
      return true
    } else {
      return false
    }
  } catch (e) {
    return false
  }
}
const transcribeRemote = async (
  file: Uint8Array | string,
  model?: 'general' | 'small' | 'existing',
  prompt?: string,
  signal?: AbortSignal
) => {
  if (typeof file === 'string' && model === 'existing') {
    const res = await request<IWebRequest<{ text: string; segments: { start: number; end: number; text: string }[]; creditUsage: number }>>(
      Interface.AI('transcribe'),
      {
        data: {
          prompt,
          url: file,
          mode: model
        },
        method: 'POST',
        signal
      }
    )
    return res.data.result
  }
  if (typeof file === 'string') {
    try {
      await request(Interface.AI('isValidAudio'), {
        params: {
          url: file
        }
      })
    } catch (e) {
      const fetched = await fetch(file).then(i => i.arrayBuffer())
      return await uploadAndTranscribe(new Blob([fetched]), model ?? 'general', prompt, signal)
    }
    const res = await request<IWebRequest<{ text: string; segments: { start: number; end: number; text: string }[]; creditUsage: number }>>(
      Interface.AI('transcribe'),
      {
        data: {
          prompt,
          url: file,
          mode: model
        },
        method: 'POST',
        signal
      }
    )
    return res.data.result
  } else {
    return await uploadAndTranscribe(new Blob([file]), model ?? 'general', prompt, signal)
  }
}

const transcribe = async (
  file: Uint8Array | string,
  options?: {
    name?: string
    signal?: AbortSignal
    prompt?: string
    model?: 'general' | 'small' | 'existing'
  }
) => {
  if (!OFFICIAL_BACKEND_ENABLED) {
    toast.error(t(trans.FeatureNeedServer))
    return Promise.reject()
  }
  return await transcribeRemote(file, options?.model, options?.prompt, options?.signal)
}

const getAIOutputLanguage = (): string => {
  const language = GlobalSetting.getSetting().AI.language || 'English'
  return language
}

const getAvailableAILanguages = () => {
  return [
    'Arabic',
    '简体中文',
    '繁體中文',
    'Danish',
    'Dutch',
    'English',
    'French',
    'German',
    'Hindi',
    'Indonesian',
    'Irish',
    'Italian',
    'Japanese',
    'Korean',
    'Latin',
    'Malayalam',
    'Norwegian',
    'Polish',
    'Portuguese',
    'Portuguese (Brazil)',
    'Portuguese (Portugal)',
    'Russian',
    'Spanish',
    'Spanish (Latin American)',
    'Thai',
    'Turkish',
    'Vietnamese'
  ]
}
const AIService = {
  buyAICredit,
  freeChargeAICredit,
  transcribe,
  chatStructured: chatStructuredStandard,
  chatStream: chatStreamStandard,
  hasTranscript,
  getAIOutputLanguage,
  getAvailableAILanguages
}

export default AIService
