import { deserializeHTML, normalize } from '@/core/components/editor/plugins/deserializeHtml'
import Id from '@/utils/id'
import Parser from '@postlight/parser'
import { getFavicon } from '@/core/components/webpage/utils/previewWebUrl'
import { Node } from 'slate'

const parser = new DOMParser()
const fetchUrlAndParseNote = async (
  url: string
): Promise<
  | {
      noteValue: import('slate').Descendant[] | undefined
      title: string
      author?: string
      domain: string
      image?: string
      favicon?: string
    }
  | undefined
> => {
  const res = await Parser.parse(url)
  if (res) {
    console.log(res)
    const parsedDoc = parser.parseFromString(res.content, 'text/html')
    console.log(parsedDoc)
    const result = deserializeHTML(parsedDoc.body)
    result.forEach(i => (i.id = Id.getId()))
    const normalized = normalize(result).filter(i => 'type' in i)
    if (res.lead_image_url) {
      if (!Array.from(Node.elements({ children: normalized })).some(i => i[0].type === 'image' && i[0].url === res.lead_image_url)) {
        normalized.unshift({
          id: Id.getId(),
          type: 'image',
          url: res.lead_image_url,
          children: [{ text: '' }]
        })
      }
    }
    const doc = parser.parseFromString(await fetch(url).then(res => res.text()), 'text/html')
    const favicon = await getFavicon(doc, url)
    return {
      noteValue: normalized,
      title: res.title,
      favicon,
      image: res.lead_image_url,
      author: res.author,
      domain: res.domain || 'Unknown'
    }
  }
}

export default fetchUrlAndParseNote
