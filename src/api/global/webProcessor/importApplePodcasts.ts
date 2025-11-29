import { IImportResult } from '@/api/global/fileProcessor'
import { IAudio } from '~/typings'
import EpisodeServices from '@/core/components/podcast/services/episodeServices'

export default async (url: string): Promise<IImportResult<IAudio>> => {
  const res = await EpisodeServices.getEpisodeDetailsByURL(url)
  if (res) {
    console.log(res)
    return {
      object: {
        specType: 'audio',
        url: res.assetUrl
      },
      meta: {
        name: res.title,
        coverImgSrc: res.image,
        description: res.description,
        type: 'audio'
      }
    }
  }
  return Promise.reject()
}
