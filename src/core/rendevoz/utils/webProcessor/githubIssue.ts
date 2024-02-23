export default function processGithubIssue(url: string, html: string) {
  if (url.includes('github.com') && url.includes('issues/')) {
    const dParser = new DOMParser()
    const doc = dParser.parseFromString(html, 'text/html')
    const markdownBody = doc.body.querySelectorAll('td.markdown-body')
    doc.body.querySelectorAll('ul').forEach(i => {
      const p = document.createElement('p')
      p.replaceChildren(...i.children)
      i.parentNode?.replaceChild(p, i)
    })
    doc.body.querySelectorAll('ol').forEach(i => {
      const p = document.createElement('p')
      p.replaceChildren(...i.children)
      i.parentNode?.replaceChild(p, i)
    })
    if (markdownBody) {
      let nodes: Node[] = []
      Array.from(markdownBody.values()).forEach(i => {
        const author = i.closest('div.timeline-comment')?.querySelector('a.author')?.textContent
        if (author) {
          const authorNode = document.createElement('div')
          authorNode.innerText = author + ' commented:'
          nodes = [...nodes, authorNode, ...i.children]
        } else {
          nodes = [...nodes, ...i.children]
        }
      })
      doc.body.replaceChildren(...nodes)
    }
    return doc.documentElement.outerHTML
  }
  return html
}
