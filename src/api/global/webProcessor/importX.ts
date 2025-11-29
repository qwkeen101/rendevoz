import { IImportResult } from '@/api/global/fileProcessor'
import { ITweet } from '~/typings'

export default async (url: string): Promise<IImportResult<ITweet>> => {
  const res = await Global.utils.fetchDetails(url)
  return {
    object: {
      specType: 'tweet',
      url
    },
    meta: {
      name: res.title,
      description: res.description,
      coverImgSrc: res.image,
      type: 'tweet'
    }
  }
}
