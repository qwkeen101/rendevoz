import { request } from '@/utils/request'
import { blob } from 'd3'
import { getUser } from './login.service'
import { toast } from 'react-hot-toast'

const localImageOcrInterface = 'http://localhost:9000/image/ocr'
const remoteOcrInterface = 'https://api.rendevoz.com/image/ocr'
const OcrService = {
  ocrImage: (
    image: Blob
  ): Promise<
    | {
        result: {
          words: string
        }[]
      }
    | undefined
  > => {
    const user = getUser()
    if (!user || !user.premiumEndDate || user.premiumEndDate < Date.now()) {
      return Promise.reject()
    }
    return new Promise(res => {
      const reader = new FileReader()
      reader.onload = async e => {
        const result = e.target?.result?.toString()
        if (result) {
          const ocrResult = await request(remoteOcrInterface, {
            data: new URLSearchParams({
              image: result
            }),
            method: 'POST',
            headers: {
              'content-type': 'application/x-www-form-urlencoded'
            }
          })
          res(ocrResult.data)
        }
      }
      reader.readAsDataURL(image)
    })
  }
}

export default OcrService
