import { Content, Icon } from '@/components/base'
import { useMutationObserver } from '@/components/editor/slate-react/hooks/use-mutation-observer'
import { KEY } from '@/consts/key'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import produce from 'immer'
import isHotkey from 'is-hotkey'
import { useEffect, useRef, useState } from 'react'
import { IWhiteboardNode } from '~/typings/data'
import { useSetWhiteboardNodes } from '../hooks'

type History = {
  prev?: History
  curr: string
  next?: History
}
const WebpageNode = ({ node }: { node: IWhiteboardNode & { type: 'webpage' } }) => {
  const ref = useRef<HTMLWebViewElement>(null)
  const setNodes = useSetWhiteboardNodes()
  const [url, setUrl] = useState(node.url)
  const [displayUrl, setDisplayUrl] = useState(node.url)
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
      setTimeout(() => {
        setNodes(nodes =>
          produce(nodes, draft => {
            draft.set(node.id, {
              ...nodes.get(node.id)!,
              url: data.url
            })
          })
        )
      })
    }
    const titleHandler = (data: any) => {
      setTimeout(() => {
        setNodes(nodes =>
          produce(nodes, draft => {
            draft.set(node.id, {
              ...nodes.get(node.id)!,
              name: data.title
            })
          })
        )
      })
    }
    ref.current?.addEventListener('did-navigate', navigateHandler)
    ref.current?.addEventListener('did-navigate-in-page', navigateHandler)
    ref.current?.addEventListener('page-title-updated', titleHandler)
    return () => {
      ref.current?.removeEventListener('did-navigate', navigateHandler)
      ref.current?.removeEventListener('did-navigate-in-page', navigateHandler)
      ref.current?.removeEventListener('page-title-updated', titleHandler)
    }
  }, [])
  return (
    <Content flex column fullHeight fullWidth auto>
      <Content flex gap={8} alignItems="center" style={{ fontSize: 18, color: '#8590ae', padding: '6px 16px' }}>
        <Icon className={ClassName.circleButton()} name="park-left" onClick={() => handleNavigate('back')} />
        <Icon className={ClassName.circleButton()} name="park-right" onClick={() => handleNavigate('forward')} />
        <Icon className={ClassName.circleButton()} name="park-refresh" onClick={() => ref.current?.reload()} />
        <input
          value={displayUrl}
          onChange={e => {
            setDisplayUrl(e.target.value)
          }}
          style={{
            border: 'none',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'rgba(0,0,0,0.06)',
            flex: 1,
            lineHeight: 1
          }}
          className={css({
            outline: 'none',
            ':focus': {
              outline: '1px solid #8590ae'
            }
          })}
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              if (displayUrl.startsWith('https://') || displayUrl.startsWith('http://')) {
                ref.current?.loadURL(displayUrl)
              } else {
                ref.current?.loadURL('https://' + displayUrl)
              }
            }
          }}
        ></input>
      </Content>
      <webview
        style={{
          flex: 1,
          width: '100%',
          height: '100%'
        }}
        ref={ref}
        src={url}
        allowpopups="true"
      />
    </Content>
  )
}

export default WebpageNode
