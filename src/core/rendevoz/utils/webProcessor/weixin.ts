export default function processWeixin(url: string, html: string) {
  if (url.includes('mp.weixin.qq.com/s/')) {
    const dom = new DOMParser().parseFromString(html, 'text/html')
    const content = dom.querySelector('.rich_media_content')
    if (content) {
      return content.outerHTML
    }
  }
  return html
}
