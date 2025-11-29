export type WebPreviewResult = {
  image?: string
  title?: string
  description?: string
  domain?: string
  favicon?: string
  length?: number
  excerpt?: string
  content?: string
  language?: string
}

import { Readability } from '@mozilla/readability'

const imageAccessible = async (url: string) => {
  if (url.includes('base64')) {
    return true
  }
  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (res.status === 200 && res.headers.get('Content-type')?.startsWith('image')) {
      return true
    }
    return false
  } catch (e) {
    return false
  }
}

export const getImg = async (doc: Document, uri: string): Promise<string | undefined> => {
  const head = doc.head
  const ogImg = head.querySelector('meta[property="og:image"]')
  if (ogImg !== null) {
    const url = ogImg.getAttribute('content')
    if (url && (await imageAccessible(url))) {
      return url
    }
  }
  const imgRelLink = head.querySelector('link[rel="image_src"]')
  if (imgRelLink !== null) {
    const url = imgRelLink.getAttribute('href')
    if (url && (await imageAccessible(url))) {
      return url
    }
  }
  const twitterImg = head.querySelector('meta[name="twitter:image"]')
  if (twitterImg !== null) {
    const url = twitterImg.getAttribute('content')
    if (url && (await imageAccessible(url))) {
      return url
    }
  }
  const firstImg = doc.body.querySelector('img')
  if (firstImg) {
    let src = firstImg.src
    if (!src) return
    if (src.indexOf('//') === -1) {
      src = `${new URL(uri).origin}/${firstImg.src}`
    }
    if (await imageAccessible(src)) {
      return src
    }
  }
}

const getTitle = async (doc: Document): Promise<string | undefined> => {
  const head = doc.head
  const ogTitle = head.querySelector('meta[property="og:title"]')
  if (ogTitle !== null) {
    const title = ogTitle.getAttribute('content')
    if (title && title.length > 0) {
      return title
    }
  }
  const twitterTitle = head.querySelector('meta[name="twitter:title"]')
  if (twitterTitle !== null) {
    const title = twitterTitle.getAttribute('content')
    if (title && title.length > 0) {
      return title
    }
  }
  const docTitle = doc.title
  if (docTitle !== null && docTitle.length > 0) {
    return docTitle
  }
  const h1 = doc.querySelector('h1')
  if (h1 !== null) {
    const content = h1.textContent
    if (content && content.length > 0) {
      return content
    }
  }
}

const getDescription = async (doc: Document): Promise<string | undefined> => {
  const head = doc.head
  const ogDescription = head.querySelector('meta[property="og:description"]')
  if (ogDescription != null) {
    const content = ogDescription.getAttribute('content')
    if (content && content.length > 0) return content
  }
  const twitterDescription = head.querySelector('meta[name="twitter:description"]')
  if (twitterDescription != null) {
    const content = twitterDescription.getAttribute('content')
    if (content && content.length > 0) return content
  }
  const metaDescription = head.querySelector('meta[name="description"]')
  if (metaDescription != null) {
    const content = metaDescription.getAttribute('content')
    if (content && content.length > 0) return content
  }
  let paragraphs = doc.querySelectorAll('p')
  let fstVisibleParagraph: string | null = null
  for (let i = 0; i < paragraphs.length; i++) {
    if (
      // if object is visible in dom
      paragraphs[i].offsetParent !== null &&
      paragraphs[i].childElementCount != 0
    ) {
      fstVisibleParagraph = paragraphs[i].textContent
      break
    }
  }
  if (fstVisibleParagraph && fstVisibleParagraph.length) {
    return fstVisibleParagraph
  }
}

const getDomainName = async (doc: Document, uri: string) => {
  const getDomain = async () => {
    const canonicalLink = doc.querySelector('link[rel=canonical]')
    if (canonicalLink !== null) {
      const href = canonicalLink.getAttribute('href')
      if (href && href.length > 0) {
        return href
      }
    }
    const ogUrlMeta = doc.querySelector('meta[property="og:url"]')
    if (ogUrlMeta !== null) {
      const url = ogUrlMeta.getAttribute('content')
      if (url && url.length > 0) {
        return url
      }
    }
  }
  const domain = await getDomain()
  if (domain) {
    return new URL(domain).hostname.replace('www.', '')
  } else {
    return new URL(uri).hostname.replace('www.', '')
  }
}

export const getFavicon = async (doc: Document, uri: string) => {
  const icon16Sizes = doc.querySelector('link[rel=icon][sizes="16x16"]')
  if (icon16Sizes) {
    const href = icon16Sizes.href
    if (href && (await imageAccessible(href))) {
      return href
    }
  }
  const shortcutIcon = doc.querySelector('link[rel="shortcut icon"]')
  if (shortcutIcon) {
    const href = shortcutIcon.href
    if (href && (await imageAccessible(href))) {
      return href
    }
  }
  const icon = doc.querySelector('link[rel=icon]')
  if (icon) {
    const href = icon.href
    if (href && (await imageAccessible(href))) {
      return href
    }
  }
}

const previewWebUrl = async (uri: string, extract?: boolean): Promise<WebPreviewResult> => {
  const text = await fetch(uri).then(res => res.text())
  const doc = new DOMParser().parseFromString(text, 'text/html')
  const img = await getImg(doc, uri)
  const title = await getTitle(doc)
  const desc = await getDescription(doc)
  const domain = await getDomainName(doc, uri)
  const favicon = await getFavicon(doc, uri)
  if (extract) {
    const ar = new Readability(doc).parse()
    return {
      title,
      description: desc,
      image: img,
      domain,
      favicon,
      length: ar?.length,
      excerpt: ar?.excerpt,
      content: ar?.textContent,
      language: ar?.lang
    }
  } else {
    return {
      title,
      description: desc,
      image: img,
      domain,
      favicon
    }
  }
}

export default previewWebUrl
