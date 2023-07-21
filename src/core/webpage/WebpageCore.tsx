import { Content } from '@/components/base'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { decreaseLevel, increaseLevel } from '../pdf/core/utils/zoom'
import useWebpageOthers from './useWebpageOthers'
import { IpcWebpageEvent } from './webpageIpcEvent'
import { useMemoizedFn } from '@/hooks'
import { waitFor } from '@/utils/functions'
import { useLatest } from 'react-use'
import useWebpageInstance from './hooks/useWebpageInstance'
import { assignProperties } from '@/utils'
import useWebpageState from './hooks/useWebpageState'
import { ObjectStore } from '@/stores'

export const DEFAULT_USER_AGENT =
  'Chrome/114.0.0.0 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36'

export type WebpageProps = {
  url?: string
  children?: ReactNode
  userAgent?: string
  onEvent?: (event: IpcWebpageEvent) => void
  disableImageClick?: boolean
}

export const WebpageCore = ({ url: _url, children, userAgent = DEFAULT_USER_AGENT, disableImageClick, onEvent }: WebpageProps) => {
  // if url change, can save as another webpage object
  const ref = useRef<HTMLWebViewElement>(null)
  const [displayUrl, setDisplayUrl] = useState(_url)
  const [webpageState, setWebpageState] = useWebpageState()
  const { navigationUrl, currentWebpage, loaded, showReaderMode } = webpageState
  const latestLoaded = useLatest(loaded)
  const faviconRef = useRef<string>()
  const { renderContextMenu } = useWebpageOthers(ref, {
    webpageId: currentWebpage?.id
  })
  const instance = useWebpageInstance()

  const messageHanlder = useMemoizedFn(e => {
    const event = e.args[0]
    console.log(event)
    if (event.x && event.y) {
      const webviewBounding = ref.current?.getBoundingClientRect()!
      onEvent?.({
        ...event,
        bodyX: webviewBounding?.left + event.x,
        bodyY: webviewBounding.top + event.y
      })
    }
  })

  useEffect(() => {
    const container = ref.current
    if (container) {
      const startLoadHandler = () => {
        setWebpageState(s => ({ ...s, loaded: false }))
      }
      const endLoadHandler = () => {
        setWebpageState(s => ({ ...s, loaded: true }))
      }

      const faviconUpdateHandler = (data: any) => {
        const { favicons } = data
        const favicon = favicons[favicons.length - 1]
        currentWebpage?.id && ObjectStore('webpage').updateOne({ id: currentWebpage?.id, favicon })
        setWebpageState(s => ({ ...s, faviconUrl: favicon }))
        faviconRef.current = data.favicons[data.favicons.length - 1]
      }
      const navigateHandler = (data: any) => {
        if (!data.url.startsWith('https://www.google.com/uviewer')) {
          setDisplayUrl(data.url)
          if (data.url !== navigationUrl) {
            setWebpageState(s => ({ ...s, navigationUrl: data.url }))
          }
        }
      }
      const titleChangeHandler = data => {
        if (data.title) {
          setWebpageState(s => ({
            ...s,
            title: data.title !== s.title ? data.title : s.title
          }))
        }
      }
      container.addEventListener('did-start-loading', startLoadHandler)
      container.addEventListener('did-stop-loading', endLoadHandler)
      container.addEventListener('page-favicon-updated', faviconUpdateHandler)
      container.addEventListener('page-title-updated', titleChangeHandler)

      container.addEventListener('did-navigate', navigateHandler)
      container.addEventListener('did-navigate-in-page', navigateHandler)
      container.addEventListener('ipc-message', messageHanlder)

      return () => {
        container.removeEventListener('did-start-loading', startLoadHandler)
        container.removeEventListener('did-stop-loading', endLoadHandler)
        container.removeEventListener('page-favicon-updated', faviconUpdateHandler)
        container.removeEventListener('did-navigate', navigateHandler)
        container.removeEventListener('page-title-updated', titleChangeHandler)
        container.removeEventListener('ipc-message', messageHanlder)
        container.removeEventListener('did-navigate-in-page', navigateHandler)
      }
    }
  }, [webpageState])

  const findInPage = useMemoizedFn(text => {
    waitFor(
      () => {
        // console.log(loaded)
        return latestLoaded.current
      },
      () => {
        ref.current?.findInPage(text, {
          forward: false
        })
        setTimeout(() => {
          ref.current?.findInPage(text, {
            forward: false
          })
        }, 100)
      },
      {
        timeout: 30000,
        checkDelay: 200,
        checkEnsure: 3
      }
    )
  })

  useEffect(() => {
    setTimeout(() => {
      if (disableImageClick) {
        ref.current?.send('disableImageClick')
      } else {
        ref.current?.send('enableImageClick')
      }
    }, 1000)
  }, [disableImageClick])

  assignProperties(instance, {
    capturePage: () => {
      return ref.current?.capturePage()
    },
    getId: () => {
      return ref.current?.getWebContentsId()
    },
    getUrl: () => {
      return ref.current?.getURL()
    },
    zoomIn: () => {
      const zoomFactor = ref.current?.getZoomFactor()
      ref.current?.setZoomFactor(increaseLevel(zoomFactor))
    },
    zoomOut: () => {
      const zoomFactor = ref.current?.getZoomFactor()
      ref.current?.setZoomFactor(decreaseLevel(zoomFactor))
    },
    setUserAgent: agent => {
      if (loaded) {
        ref.current?.setUserAgent?.(agent)
      }
    },
    clipHTML: async () => {
      if (loaded && displayUrl) {
        const html = await ref.current?.executeJavaScript(
          `function gethtml () {
    return new Promise((resolve, reject) => { resolve(document.documentElement.innerHTML); });
    }
    gethtml();`
        )
        return {
          html,
          url: displayUrl
        }
      }
      throw new Error('Not clippable')
    },
    navigateBack: () => {
      const webview = ref.current
      if (!webview) return
      if (webview.canGoBack()) {
        webview.goBack()
        const newUrl = webview.getURL()
        return newUrl
      }
    },
    navigateForward: () => {
      const webview = ref.current
      if (!webview) return
      if (webview.canGoForward()) {
        webview.goForward()
        const newUrl = webview.getURL()
        return newUrl
      }
    },
    navigateTo: url => {
      const webview = ref.current
      if (!webview) return
      webview.loadURL(url)
    },
    refresh: () => {
      const webview = ref.current
      if (!webview) return
      webview.reload()
    },
    stop: () => {
      const webview = ref.current
      if (!webview) return
      webview.stop()
    },
    findInPage
  })

  return (
    <Content flex column fullWidth fullHeight auto>
      {children && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: !showReaderMode ? 'none' : 'block'
          }}
        >
          {children}
        </div>
      )}
      <webview
        useragent={userAgent}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          display: children && showReaderMode ? 'none' : 'flex',
          pointerEvents: children && showReaderMode ? 'none' : 'auto'
        }}
        ref={ref}
        src={_url}
        httpreferrer=""
        allowpopups="true"
      />
      {renderContextMenu()}
    </Content>
  )
}
