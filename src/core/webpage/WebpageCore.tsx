import { Content } from '@/components/base'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { decreaseLevel, increaseLevel } from '../pdf/core/utils/zoom'
import useWebpageOthers from './useWebpageOthers'
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
}

export const WebpageCore = ({ url: _url, children, userAgent = DEFAULT_USER_AGENT }: WebpageProps) => {
  // if url change, can save as another webpage object
  const ref = useRef<HTMLWebViewElement>(null)
  const [webpageState, setWebpageState] = useWebpageState()
  const { navigationUrl, currentWebpage, loaded, showReaderMode } = webpageState

  const { renderContextMenu } = useWebpageOthers(ref, {
    webpageId: currentWebpage?.id
  })
  const instance = useWebpageInstance()

  useEffect(() => {
    const container = ref.current
    if (container) {
      const startLoadHandler = () => {
        setWebpageState(s => ({ ...s, loaded: false }))
      }
      const endLoadHandler = () => {
        setWebpageState(s => ({ ...s, loaded: true }))
      }
      const navigateHandler = (data: any) => {
        if (!data.url.startsWith('https://www.google.com/uviewer')) {
          if (data.url !== navigationUrl) {
            setWebpageState(s => ({ ...s, navigationUrl: data.url }))
          }
        }
      }
      container.addEventListener('did-start-loading', startLoadHandler)
      container.addEventListener('did-stop-loading', endLoadHandler)
      container.addEventListener('did-navigate', navigateHandler)
      container.addEventListener('did-navigate-in-page', navigateHandler)

      return () => {
        container.removeEventListener('did-start-loading', startLoadHandler)
        container.removeEventListener('did-stop-loading', endLoadHandler)
        container.removeEventListener('did-navigate', navigateHandler)
        container.removeEventListener('did-navigate-in-page', navigateHandler)
      }
    }
  }, [webpageState])

  assignProperties(instance, {
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
      />
      {renderContextMenu()}
    </Content>
  )
}
