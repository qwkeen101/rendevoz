import { IAISearchSource } from '~/typings'
import retry from 'async-retry'
import { Id } from '@/utils'
type ISemanticScholarSearchResult = {
  total: number
  offset: number
  data: {
    paperId: string
    title: string
    openAccessPdf: {
      url?: string
    }
    journal?: {
      name: string
    }
    abstract?: string
    authors: {
      authorId: string
      name: string
    }[]
  }[]
}
export default async (query: string): Promise<IAISearchSource[]> => {
  const splittedQuery = encodeURIComponent(query.split(' ').join('+'))
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${splittedQuery}&fields=title,abstract,journal&limit=50`
  const res = await retry(
    async () => {
      return (await fetch(url).then(i => i.json())) as ISemanticScholarSearchResult
    },
    { retries: 3 }
  )
  return (
    res?.data?.map(i => ({
      id: Id.getId(),
      title: i.title,
      abstract: i.abstract,
      url: `https://www.semanticscholar.org/paper/${i.paperId}`,
      pdfDownloadUrl: i.openAccessPdf?.url,
      type: 'scholar',
      source: i.journal?.name
    })) || []
  )
}
