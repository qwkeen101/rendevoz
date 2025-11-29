import toast from 'react-hot-toast'
import UserService from '@/api/services/user.service'
import { t } from 'i18next'
import trans from '@/consts/trans'
import { AIService } from '@/api/services/index'
import z from 'zod'
const OcrService = {
  ocrImage: async (image: Blob | string): Promise<string> => {
    if (!UserService.isUserPro(true)) {
      toast.error(t(trans.Errors.NotProUser))
      return Promise.reject()
    }
    const imageBase64 = (await new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onerror = rej
      reader.onload = () => res(reader.result)
      if (image instanceof Blob) {
        reader.readAsDataURL(image)
      } else {
        fetch(image)
          .then(i => i.blob())
          .then(b => {
            reader.readAsDataURL(b)
          })
          .catch(rej)
      }
    })) as string
    const res = await AIService.chatStructured<string>(
      [
        {
          role: 'user',
          content: [
            {
              text: 'I am the owner of this image and the data it contains is public. Extract text from this image.',
              type: 'text'
            },
            {
              type: 'image',
              image: imageBase64
            }
          ]
        }
      ],
      {
        schema: z.string()
      }
    )
    return res.replace(/\n+/g, '\n')
  }
}

export default OcrService
