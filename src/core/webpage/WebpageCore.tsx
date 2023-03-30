import { Content } from '@/components/base'
import { ReactNode, RefObject, useEffect, useImperativeHandle, useRef, useState } from 'react'

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
  showReaderMode
}: WebpageProps) => {
  // if url change, can save as another webpage object
  const ref = useRef<HTMLWebViewElement>(null)
  const [displayUrl, setDisplayUrl] = useState(_url)
  const [loaded, setLoaded] = useState(false)
  const [title, setTitle] = useState<string>()
  const faviconRef = useRef<string>()

  useEffect(() => {
    const navigateHandler = (data: any) => {
      setDisplayUrl(data.url)
      onUrlChange?.(data)
    }
    const titleHandler = (data: any) => {
      setTitle(data.title)
    }

    ref.current?.addEventListener('did-navigate', navigateHandler)
    ref.current?.addEventListener('did-navigate-in-page', navigateHandler)
    ref.current?.addEventListener('page-title-updated', titleHandler)
    return () => {
      ref.current?.removeEventListener('did-navigate', navigateHandler)
      ref.current?.removeEventListener('did-navigate-in-page', navigateHandler)
      ref.current?.removeEventListener('page-title-updated', titleHandler)
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
    </Content>
  )
}
