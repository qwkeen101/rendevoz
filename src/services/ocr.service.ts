import { request } from '@/utils/request'
import { blob } from 'd3'

const localImageOcrInterface = 'http://localhost:9000/image/ocr'
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
    return new Promise(res => {
      const reader = new FileReader()
      reader.onload = async e => {
        const result = e.target?.result?.toString()
        if (result) {
          const ocrResult = await request(localImageOcrInterface, {
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
