import { Utils } from '~/typings/rendevoz'
import { deserializeHTML, normalize } from '@/core/components/editor/plugins/deserializeHtml'
import Id from '@/utils/id'
import { Node } from 'slate'
import { getFavicon, getImg } from '@/core/components/webpage/utils/previewWebUrl'
import { default as PostlightParser } from '@postlight/parser'
import { Readability } from '@mozilla/readability'
const domParser = new DOMParser()
import { getTweet } from 'react-tweet/api'
import processGithubIssue from '@/core/rendevoz/utils/webProcessor/githubIssue'
import { normalizeResult } from '@/core/components/editor/plugins/transformHTML/deserializeHTML'
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
    // const res = await PostlightParser.parse(url, {
    //   html: prefetchedHTML
    // })
    const r = new Readability(domParser.parseFromString(prefetchedHTML, 'text/html')).parse()
    if (r) {
      const parsedDoc = domParser.parseFromString(r.content, 'text/html')
      console.log(parsedDoc)
      const result = deserializeHTML(parsedDoc.body)
      console.log(result)
      const normalized = normalizeResult(result, url)
      console.log(normalized)
      const doc = domParser.parseFromString(await fetch(url).then(res => res.text()), 'text/html')
      const favicon = await getFavicon(doc, url)
      const image = await getImg(doc, url)
      if ((!normalized.length || normalized[0].type !== 'image') && image) {
        normalized.unshift({
          id: Id.getId(),
          type: 'image',
          url: image,
          children: [{ text: '' }]
        })
      }
      let domain = 'Unknown'
      try {
        const u = new URL(url)
        domain = u.hostname.replace('www.', '')
      } catch (e) {}
      return {
        content: normalized,
        title: r.title,
        favicon,
        image: image,
        author: r.byline,
        domain: domain || 'Unknown'
      }
    }
    throw 'Failed to parse webpage!'
  }
}

export default WebUtils
