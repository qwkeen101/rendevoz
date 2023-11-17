import { deserializeHTML, normalize } from '@/core/components/editor/plugins/deserializeHtml'
import Id from '@/utils/id'
import { Node } from 'slate'
import { getFavicon } from '@/core/components/webpage/utils/previewWebUrl'
import Parser from '@postlight/parser'

const parser = new DOMParser()
export default async (html: string, url: string) => {
  const res = await Parser.parse(url, {
    html
  })
  if (res) {
    const parsedDoc = parser.parseFromString(res.content, 'text/html')
    const result = deserializeHTML(parsedDoc.body)
    console.log(result, parsedDoc.body, html)
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
