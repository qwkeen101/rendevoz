// electron only (maybe)
import { Content } from '@/components'
import WebpageNavigation from '@/core/components/webpage/WebpageNavigation'
import { useEffect, useRef, useState } from 'react'
import { useGlobalAtomValue } from '@/hooks'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'
import { Rendevoz } from '@/core/rendevoz'
import { urlToIdMap } from '@/api/indexData/urlToId'

export default ({
  url,
  userAgent,
  onUrlChange,
  onAddAsMeta
}: {
  url: string
  userAgent?: string
  onUrlChange?: (s: string) => void
  onAddAsMeta: (details: any) => void
}) => {
  const [currentUrl, setCurrentUrl] = useState()
  const [isLoading, setIsLoading] = useState(false)
  const isSaved = useGlobalAtomValue(urlToIdMap).has(url)
  const webviewRef = useRef<
    {
      goBack: VoidFunction
      goForward: VoidFunction
      reload: VoidFunction
      getURL: () => string
      stop: VoidFunction
    } & HTMLWebViewElement
  >()
  useEffect(() => {
    const evnHandler = e => {
      if (e.type === 'did-navigate') {
        setCurrentUrl(e.url)
      }
      if (e.type === 'did-start-loading') {
        setIsLoading(true)
      }
      if (e.type === 'did-stop-loading') {
        setIsLoading(false)
      }
      if (e.type === 'will-navigate') {
        console.log(e)
        onUrlChange(e.url)
      }
    }
    if (webviewRef.current) {
      webviewRef.current.allowpopups = 'true'
      webviewRef.current.useragent = userAgent
    }
    webviewRef.current?.addEventListener('will-navigate', evnHandler)
    webviewRef.current?.addEventListener('did-navigate', evnHandler)
    webviewRef.current?.addEventListener('did-start-loading', evnHandler)
    webviewRef.current?.addEventListener('did-stop-loading', evnHandler)
    return () => {
      webviewRef.current?.removeEventListener('will-navigate', evnHandler)
      webviewRef.current?.removeEventListener('did-navigate', evnHandler)
      webviewRef.current?.removeEventListener('did-start-loading', evnHandler)
      webviewRef.current?.removeEventListener('did-stop-loading', evnHandler)
    }
  })
  return (
    <Content fullWidth fullHeight flex column>
      <WebpageNavigation
        on={async e => {
          const w = webviewRef.current
          if (!w) return
          switch (e.action) {
            case 'saveAsMetaObject':
              {
                w.executeJavaScript(
                  `function gethtml () {
    return new Promise((resolve, reject) => { resolve(document.documentElement.innerHTML); });
    }
    gethtml();`
                ).then(async html => {
                  const result = await Rendevoz.Utils.Web.parseWebpage(url, html)
                  if (result) {
                    onAddAsMeta?.({
                      ...result,
                      url: currentUrl
                    })
                  }
                })
              }
              break
            case 'refresh': {
              w.reload()
              break
            }
            case 'stop': {
              w.stop()
              break
            }
            case 'loadUrl': {
              if (e.url.startsWith('http')) {
                onUrlChange?.(e.url)
              } else {
                GlobalSearchInstance.open({
                  query: e.url
                })
              }

              break
            }
            case 'back': {
              w.goBack()
              break
            }
            case 'forward': {
              w.goForward()
              break
            }
          }
        }}
        navigationState={{
          loaded: !isLoading,
          displayUrl: currentUrl,
          canSave: !isSaved && !isLoading
        }}
      />
      <webview
        allowpopups={'true'}
        useragent={userAgent}
        src={url}
        disablewebsecurity={true}
        ref={n => {
          if (n) {
            webviewRef.current = n
            n.allowpupups = true
            n.disablewebsecurity = true
          }
        }}
        style={{ width: '100%', height: 0, flex: 1, background: 'white' }}
      />
    </Content>
  )
}
