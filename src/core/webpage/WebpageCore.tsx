import { Content } from '@/components/base'
import { NativeImage } from 'electron/common'
import { ReactNode, RefObject, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { increaseLevel } from '../pdf/core/utils/zoom'
import { decreaseLevel } from '../pdf/core/utils/zoom'
import useWebpageOthers from './useWebpageOthers'
export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0'
export type WebpageInnerRef = {
  clip: () => Promise<{
    html: string
    url: string
  }>
  navigateTo: (url: string) => void
  navigateBack: () => string | undefined
  navigateForward: () => string | undefined
  refresh: VoidFunction
  stop: VoidFunction
  capturePage: () => Promise<NativeImage>
  getId: () => number
  zoomIn: VoidFunction
  setUserAgent: (agent: string) => void
  zoomOut: VoidFunction
  findInPage?: (text: string) => void
}

type WebpageProps = {
  url?: string
  onStartLoad?: VoidFunction
  onEndLoad?: VoidFunction
  onFaviconUpdated?: (data: { favicons: string[] }) => void
  onTitleChange?: (data: { title: string }) => void
  onUrlChange?: (data: { url: string }) => void
  showReaderMode: boolean
  innerRef?: RefObject<WebpageInnerRef | undefined>
  children?: ReactNode
  userAgent?: string
  webpageId?: number
}

export const WebpageCore = ({
  url: _url,
  children,
  onStartLoad,
  onEndLoad,
  onFaviconUpdated,
  onTitleChange,
  onUrlChange,
  innerRef,
  userAgent = DEFAULT_USER_AGENT,
  showReaderMode,
  webpageId
}: WebpageProps) => {
  // if url change, can save as another webpage object
  const ref = useRef<HTMLWebViewElement>(null)
  const [displayUrl, setDisplayUrl] = useState(_url)
  const [loaded, setLoaded] = useState(false)
  const [title, setTitle] = useState<string>()
  const faviconRef = useRef<string>()
  const { renderContextMenu } = useWebpageOthers(ref, {
    webpageId
  })
  useEffect(() => {
    const navigateHandler = (data: any) => {
      setDisplayUrl(data.url)
      onUrlChange?.(data)
    }
    const titleHandler = (data: any) => {
      setTitle(data.title)
    }
    const messageHanlder = e => {
      console.log(e)
    }
    ref.current?.addEventListener('did-navigate', navigateHandler)
    ref.current?.addEventListener('did-navigate-in-page', navigateHandler)
    ref.current?.addEventListener('page-title-updated', titleHandler)
    ref.current?.addEventListener('ipc-message', messageHanlder)

    return () => {
      ref.current?.removeEventListener('did-navigate', navigateHandler)
      ref.current?.removeEventListener('page-title-updated', titleHandler)
      ref.current?.removeEventListener('ipc-message', messageHanlder)
      ref.current?.removeEventListener('did-navigate-in-page', navigateHandler)
    }
  }, [onUrlChange])
  useEffect(() => {
    const container = ref.current
    if (container) {
      const startLoadHandler = () => {
        onStartLoad?.()
        setLoaded(false)
      }
      const endLoadHandler = () => {
        onEndLoad?.()
        setLoaded(true)
        // const webview = ref.current
        // if (webview) {
        //   webview.executeJavaScript(`
        //   document.addEventListener('click', function(e) {
        //     const targetLink = e.target.closest('a')
        //     if (targetLink){
        //       e.preventDefault()
        //       const url = targetLink.href
        //       if (url){
        //         window.location.href = url
        //       }
        //     }
        //   })
        // `)
        // }
      }

      const faviconUpdateHandler = (data: any) => {
        onFaviconUpdated?.(data)
        faviconRef.current = data.favicons[data.favicons.length - 1]
      }
      onStartLoad && container.addEventListener('did-start-loading', startLoadHandler)
      onEndLoad && container.addEventListener('did-stop-loading', endLoadHandler)
      onFaviconUpdated && container.addEventListener('page-favicon-updated', faviconUpdateHandler)
      onTitleChange && container.addEventListener('page-title-updated', onTitleChange)
      return () => {
        onStartLoad && container.removeEventListener('did-start-loading', startLoadHandler)
        onEndLoad && container.removeEventListener('did-stop-loading', endLoadHandler)
        onFaviconUpdated && container.removeEventListener('page-favicon-updated', faviconUpdateHandler)
        onTitleChange && container.removeEventListener('page-title-updated', onTitleChange)
      }
    }
  }, [onStartLoad, onEndLoad, onFaviconUpdated])
  useImperativeHandle(innerRef, () => ({
    capturePage: () => {
      return ref.current?.capturePage()
    },
    getId: () => {
      return ref.current?.getWebContentsId()
    },
    zoomIn: () => {
      const zoomFactor = ref.current?.getZoomFactor()
      ref.current.setZoomFactor(increaseLevel(zoomFactor))
    },
    zoomOut: () => {
      const zoomFactor = ref.current?.getZoomFactor()
      ref.current.setZoomFactor(decreaseLevel(zoomFactor))
    },
    setUserAgent: agent => {
      if (loaded) {
        ref.current?.setUserAgent?.(agent)
      }
    },
    clip: async () => {
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
    }
  }))
  useEffect(() => {
    if (innerRef?.current) {
      if (loaded) {
        innerRef.current.findInPage = text => {
          ref.current?.findInPage(text, {
            forward: false
          })
          setTimeout(() => {
            ref.current?.findInPage(text, {
              forward: false
            })
          }, 100)
        }
      } else {
        delete innerRef.current.findInPage
      }
    }
  })
  return (
    <Content flex column fullWidth fullHeight auto>
      {children && (
        <div
          style={{
            width: '100%',
            height: 'calc(100% - 44px)',
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
        allowpopups="true"
      />
      {renderContextMenu()}
    </Content>
  )
}
