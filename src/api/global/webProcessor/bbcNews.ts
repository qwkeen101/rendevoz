//www.bbc.com/news
export default function processBBCNews(url: string, html: string) {
  if (url.includes('www.bbc.com/news')) {
    const dom = new DOMParser().parseFromString(html, 'text/html')
    dom.querySelectorAll("img[src='/bbcx/grey-placeholder.png']").forEach(i => i.remove())
    return dom.documentElement.outerHTML
  }
  return html
}
