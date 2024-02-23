import { Utils } from '~/typings/rendevoz'
import { deserializeHTML, normalize } from '@/core/components/editor/plugins/deserializeHtml'
import Id from '@/utils/id'
import { Node } from 'slate'
import { getFavicon } from '@/core/components/webpage/utils/previewWebUrl'
import { default as PostlightParser } from '@postlight/parser'
const domParser = new DOMParser()
import { getTweet } from 'react-tweet/api'
import processGithubIssue from '@/core/rendevoz/utils/webProcessor/githubIssue'
const tweetRegexp = /https:\/\/twitter\.com\/\w+\/status\/\d+/gm

const WebUtils: (typeof Utils)['Web'] = {
  fetchDetails: async url => {
    // is tweet
    const reg = new RegExp(tweetRegexp)
    if (reg.test(url)) {
      const id = url.split('/').pop() as string
      const result = await getTweet(id)
      if (result) {
        let image: string | undefined = undefined
        if (result.photos?.length) {
          image = result.photos[0].url
        }
        if (result.mediaDetails?.length) {
          const img = result.mediaDetails.find(i => i.type === 'photo')
          if (img) {
            image = img.media_url_https
          }
        }
        console.log(result)
        return {
          title: result.text,
          image
        }
      }
      return
    }
    const res = await fetch(url)
    const text = await res.text()
    function isHTML(str: string) {
      const regexForHTML = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/
      return regexForHTML.test(str)
    }
    if (!isHTML(text)) throw 'Not HTML web!'
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
    let prefetchedHTML = html || (await fetch(url).then(r => r.text()))
    if (!prefetchedHTML) throw 'Failed to parse webpage!'
    prefetchedHTML = processGithubIssue(url, prefetchedHTML)
    console.log(prefetchedHTML)
    const res = await PostlightParser.parse(url, {
      html: prefetchedHTML
    })
    if (res) {
      const parsedDoc = domParser.parseFromString(res.content, 'text/html')
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
