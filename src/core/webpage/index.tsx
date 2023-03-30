import { Content, Icon, Tooltip } from '@/components/base'
import { KEY } from '@/consts/key'
import { GlobalEventEmitter } from '@/events'
import { ObjectStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import isHotkey from 'is-hotkey'
import { ReactNode, RefObject, useEffect, useImperativeHandle, useRef, useState } from 'react'

export type WebpageInnerRef = {
  clip: () => Promise<{
    html: string
    url: string
  }>
}
type WebpageProps = {
  url?: string
  onStartLoad?: VoidFunction
  onEndLoad?: VoidFunction
  onFaviconUpdated?: (data: { favicons: string[] }) => void
  onTitleChange?: (data: { title: string }) => void
  onUrlChange?: (data: { url: string }) => void
  innerRef?: RefObject<WebpageInnerRef | undefined>
  children?: ReactNode
} & (
  | {
      clippable: true
      onClip?: (html: string, currentUrl: string) => void
    }
  | {
      clippable: false | undefined
      onClip: never
    }
)
export const Webpage = ({
  url: _url,
  clippable,
  children,
  onStartLoad,
  onEndLoad,
  onFaviconUpdated,
  onTitleChange,
  onUrlChange,
  innerRef,
  ...rest
}: WebpageProps) => {
  // if url change, can save as another webpage object
  const ref = useRef<HTMLWebViewElement>(null)
  // innerurl handle prop url is undefined
  const [innerUrl, setInnerUrl] = useState(_url !== '' ? _url : undefined)
  const [url, setUrl] = useState(_url)
  const [displayUrl, setDisplayUrl] = useState(_url)
  const [loaded, setLoaded] = useState(false)
  const [showOrigin, setShowOrigin] = useState(false)
  const [title, setTitle] = useState<string>()
  const faviconRef = useRef<string>()
  const handleNavigate = (direction: 'back' | 'forward') => {
    const webview = ref.current
    if (!webview) return
    if (direction === 'back') {
      if (webview.canGoBack()) {
        webview.goBack()
        const newUrl = webview.getURL()
        setDisplayUrl(webview.getURL())
      }
    } else {
      if (webview.canGoForward()) {
        webview.goForward()
        const newUrl = webview.getURL()
        setDisplayUrl(newUrl)
      }
    }
  }
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
      if (loaded && clippable && displayUrl) {
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
    }
  }))
  return (
    <Content flex column fullHeight fullWidth auto>
      <Content flex gap={8} alignItems="center" style={{ fontSize: 18, color: '#8590ae', padding: '6px 16px', paddingTop: '2px' }}>
        <Icon className={ClassName.circleButton()} name="park-left" onClick={() => handleNavigate('back')} />
        <Icon className={ClassName.circleButton()} name="park-right" onClick={() => handleNavigate('forward')} />
        <Icon
          className={ClassName.circleButton()}
          name={loaded ? 'park-refresh' : 'park-close'}
          onClick={() => {
            if (loaded) {
              ref.current?.reload()
            } else {
              ref.current?.stop()
            }
          }}
        />
        <Content
          flex
          alignItems="center"
          justifyContent="space-between"
          auto
          className={css({
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'rgba(0,0,0,0.06)',
            ':focus-within': {
              outline: '1px solid #8590ae'
            }
          })}
        >
          <input
            value={displayUrl}
            onChange={e => {
              setDisplayUrl(e.target.value)
            }}
            style={{
              border: 'none',
              flex: 1,
              lineHeight: 1,
              background: 'transparent'
            }}
            className={css({
              outline: 'none'
            })}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                if (displayUrl?.startsWith('https://') || displayUrl?.startsWith('http://')) {
                  if (innerUrl === undefined) {
                    setInnerUrl(displayUrl)
                  } else {
                    ref.current?.loadURL(displayUrl)
                  }
                } else {
                  if (innerUrl === undefined) {
                    setInnerUrl('https://' + displayUrl)
                  } else {
                    ref.current?.loadURL('https://' + displayUrl)
                  }
                }
              }
            }}
          ></input>
          {url !== displayUrl && loaded && (
            <Tooltip content="Save as object">
              <Icon
                name="park-save"
                containerStyle={{ marginLeft: '20px' }}
                className={ClassName.circleButton()}
                size={16}
                onClick={() => {
                  ObjectStore('webpage')
                    .addOne(
                      {
                        url: displayUrl,
                        title,
                        favicon: faviconRef.current
                      },
                      {
                        showAddModal: true
                      }
                    )
                    .then(obj => {
                      setUrl(obj.url)
                    })
                }}
              />
            </Tooltip>
          )}
          {clippable &&
            loaded &&
            (children && !showOrigin ? (
              <Tooltip content="Show Original Web Page">
                <Icon
                  name="park-web-page"
                  containerStyle={{ marginLeft: '12px' }}
                  className={ClassName.circleButton()}
                  size={16}
                  onClick={() => {
                    setShowOrigin(true)
                  }}
                />
              </Tooltip>
            ) : (
              <Tooltip content="Reader Mode">
                <Icon
                  containerStyle={{ marginLeft: '12px' }}
                  name="park-book-open"
                  className={ClassName.circleButton()}
                  size={16}
                  onClick={() => {
                    if (children) {
                      setShowOrigin(false)
                    } else {
                      ref.current
                        ?.executeJavaScript(
                          `function gethtml () {
    return new Promise((resolve, reject) => { resolve(document.documentElement.innerHTML); });
    }
    gethtml();`
                        )
                        .then(html => {
                          rest.onClip?.(html, displayUrl)
                        })
                    }
                  }}
                />
              </Tooltip>
            ))}
        </Content>
      </Content>
      {children && (
        <div
          style={{
            width: '100%',
            height: 'calc(100% - 44px)',
            display: showOrigin ? 'none' : 'block'
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
          display: children && !showOrigin ? 'none' : 'flex',
          pointerEvents: children && !showOrigin ? 'none' : 'auto'
        }}
        ref={ref}
        src={innerUrl}
        allowpopups="true"
      />
    </Content>
  )
}
