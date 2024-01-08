import { request } from '@/utils/request'
import { getUser } from './login.service'
import { IWebRequest } from '~/typings'
import toast from 'react-hot-toast'
import Interface from '@/api/services/interface'

const OcrService = {
  ocrImage: (
    image: Blob
  ): Promise<{
    result: {
      words: string
    }[]
  }> => {
    const user = getUser()
    if (!user || !user.premiumEndDate || user.premiumEndDate < Date.now()) {
      return Promise.reject()
    }
    return new Promise(res => {
      try {
        const reader = new FileReader()
        reader.onload = async e => {
          const result = e.target?.result?.toString()
          if (result) {
            const ocrResult = await request<
              IWebRequest<{
                result: {
                  words: string
                }[]
              }>
            >(Interface.OCR(), {
              data: new URLSearchParams({
                image: result
              }),
              method: 'POST',
              headers: {
                'content-type': 'application/x-www-form-urlencoded'
              }
            })
            if (ocrResult.data.status === 'ERROR') {
              toast.error(ocrResult.data.message || '')
              throw ocrResult.data.message
            } else {
              res(ocrResult.data.result)
            }
          }
        }
        reader.readAsDataURL(image)
      } catch (e) {
        toast.error('Fail to OCR image!')
      }
    })
  }
}

export default OcrService
