import COS from 'cos-js-sdk-v5'
import { request } from '@/utils/request'
import { IWebRequest } from '~/typings'
import Interface from '@/api/services/interface'
const getSTS = async () => {
  const res = await request<
    IWebRequest<{ secretId: string; secretKey: string; token: string; path: string; startTime: number; expTime: number }>
  >(Interface.AI('sts'))
  return res.data.result
}

export default async (file: Blob, model: 'general' | 'small', prompt?: string, signal?: AbortSignal) => {
  const sts = await getSTS()
  const cos = new COS({
    SecretId: sts.secretId,
    SecretKey: sts.secretKey,
    SecurityToken: sts.token,
    StartTime: sts.startTime,
    ExpiredTime: sts.expTime
  })
  await cos.uploadFile({
    Region: 'ap-hongkong',
    Bucket: 'rendevoz-1252524756',
    Key: sts.path,
    Body: file
  })
  const res = await request<IWebRequest<{ text: string; segments: { start: number; end: number; text: string }[]; creditUsage: number }>>(
    Interface.AI('transcribe'),
    {
      data: {
        prompt,
        path: sts.path,
        mode: model
      },
      method: 'POST',
      signal
    }
  )
  return res.data.result
}
