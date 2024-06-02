export default function processWeixin(url: string, html: string) {
  if (url.includes('mp.weixin.qq.com/s')) {
    const dom = new DOMParser().parseFromString(html, 'text/html')
    const content = dom.querySelector('#js_content')
    if (content) {
      return content.innerHTML
    }
  }
  return html
}
