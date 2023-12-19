import { Utils } from '~/typings/rendevoz'
import { deserializeHTML, normalize } from '@/core/components/editor/plugins/deserializeHtml'
import Id from '@/utils/id'
import { Node } from 'slate'
import { getFavicon } from '@/core/components/webpage/utils/previewWebUrl'
import { default as PostlightParser } from '@postlight/parser'
const domParser = new DOMParser()

const WebUtils: (typeof Utils)['Web'] = {
  fetchDetails: async url => {
    const res = await fetch(url)
    const text = await res.text()
    const parser = new DOMParser()
    const dom = parser.parseFromString(text, 'text/html')
    const head = dom.head
    const title = head.querySelector('title')?.textContent || ''
    const metas = Array.from(head.querySelectorAll('meta').values())
    const descriptionMeta = metas.find(i => i.name === 'description' || i.getAttribute('property') === 'og:description')?.content
    const imageMeta = metas.find(i => i.getAttribute('property') === 'og:image')?.content
    return {
      title,
      description: descriptionMeta,
      image: imageMeta
    }
  },
  parseWebpage: async (url, html) => {
    const res = await PostlightParser.parse(url, {
      html
    })
    if (res) {
      const parsedDoc = domParser.parseFromString(res.content, 'text/html')
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
      const doc = domParser.parseFromString(await fetch(url).then(res => res.text()), 'text/html')
      const favicon = await getFavicon(doc, url)
      return {
        content: normalized,
        title: res.title,
        favicon,
        image: res.lead_image_url,
        author: res.author,
        domain: res.domain || 'Unknown'
      }
    }
    throw 'Failed to parse webpage!'
  }
}

export default WebUtils
