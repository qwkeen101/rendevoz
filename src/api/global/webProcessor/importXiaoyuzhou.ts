import { IImportResult } from '@/api/global/fileProcessor'
import { IAudio } from '~/typings'

export default async (url: string): Promise<IImportResult<IAudio>> => {
  const res = await Global.utils.fetchDetails(url)
  if (res.dom) {
    const audio = res.dom.querySelector('[property="og:audio"]')?.getAttribute('content')
    if (audio) {
      const schema = res.dom.querySelector('[name="schema:podcast-show"]')?.innerHTML
      let desc = ''
      if (schema) {
        try {
          const parsed = JSON.parse(schema)
          desc = parsed.description
        } catch (e) {}
      }
      return {
        object: {
          specType: 'audio',
          url: audio
        },
        meta: {
          name: res.title,
          description: desc || res.description,
          coverImgSrc: res.image,
          type: 'audio'
        }
      }
    }
  }
  return Promise.reject()
}
