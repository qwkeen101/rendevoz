import { useEffect, useRef } from 'react'

export const GlobalWebviewInstance: Partial<{
  getTitleAndFaviconOfUrl: (url: string) => Promise<{
    title: string
    favicon: string
  }>
}> = {}
const GlobalWebview = () => {
  const globalWebviewRef = useRef<HTMLWebViewElement>(null)
  Object.assign(GlobalWebviewInstance, {
    getTitleAndFaviconOfUrl: url => {
      return new Promise(res => {
        const webview = globalWebviewRef.current
        if (webview) {
          webview.loadURL(url)
          webview.setAudioMuted(true)
          const titlePromise = new Promise<string>(res => {
            const pageTitleHandler = data => {
              res(data.title)
              webview.removeEventListener('page-title-updated', pageTitleHandler)
            }
            webview.addEventListener('page-title-updated', pageTitleHandler)
          })
          const faviconPromise = new Promise<string>(res => {
            const pageFaviconHandler = data => {
              res(data.favicons[0])
              webview.removeEventListener('page-favicon-updated', pageFaviconHandler)
            }
            webview.addEventListener('page-favicon-updated', pageFaviconHandler)
          })
          Promise.all([titlePromise, faviconPromise]).then(result => {
            res({
              title: result[0],
              favicon: result[1]
            })
            webview.stop()
            webview.loadURL('data:text/plain,Hello, world!.')
          })
        }
      })
    }
  } as typeof GlobalWebviewInstance)
  useEffect(() => {
    const webview = globalWebviewRef.current
  }, [])
  return <webview ref={globalWebviewRef} src="data:text/plain,Hello, world!." style={{ width: 0, height: 0 }} />
}

export default GlobalWebview
