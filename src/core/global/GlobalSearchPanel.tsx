import { useEffect, useRef, useState } from 'react'
import { IWebpage, MetaObject, WebpageInstance, XYPosition } from '~/typings'
import WebpagePage from '../webpage/Webpage'
import { createPortal } from 'react-dom'
import { Rnd } from 'react-rnd'
import { atom } from 'jotai'
import { useGlobalAtom, useShortcut } from '@/hooks'
import ClassName from '@/styles/classNames'
import { Zindexes } from '@/consts'
import Colors from '@/consts/colors'
import { Button, Content } from '@/components'
import FontSize from '@/consts/font'
import { css } from '@emotion/css'
import Actions from '../Actions'
import { getPanelPosition } from './utils'
import ResizeAndDrag from '@/components/base/ResizeAndDrag'
import { ObjectStore } from '@/stores'
import { searchToUrl } from '../webpage/utils'

export const GlobalSearchInstance: Partial<{
  open: (options: { pos?: XYPosition; e?: MouseEvent; url?: string; query?: string; from?: MetaObject['fromObject'] }) => void
}> = {}

const PanelDefaultSize = {
  x: window.innerWidth / 2 - 250,
  y: window.innerHeight / 2 - 300,
  width: 500,
  height: 600
}

const SearchPanelStateAtom = atom<{
  draggable: boolean
  visible: boolean
  url?: string
  summaryTarget?: string
  type?: 'searchEngine' | 'summary'
  currentPosition?: XYPosition
  size?: {
    width: number
    height: number
  }
  from?: MetaObject['fromObject']
  title?: string
  userAgent?: string
}>({
  draggable: false,
  visible: false,
  currentPosition: {
    x: PanelDefaultSize.x,
    y: PanelDefaultSize.y
  },
  size: {
    width: PanelDefaultSize.width,
    height: PanelDefaultSize.height
  }
})

const GlobalSearchPanel = () => {
  const [panelState, setPanelState] = useGlobalAtom(SearchPanelStateAtom)

  Object.assign(GlobalSearchInstance, {
    open: async ({ url, query, from, pos, e }) => {
      let webUrl = url
      const type: 'searchEngine' | 'summary' = 'searchEngine'
      const userAgent =
        'Mozilla/5.0 (Linux; Android 9.0; SAMSUNG SM-F900U Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Mobile Safari/537.36'
      webUrl = searchToUrl(query || '')

      if (url || query) {
        const _pos =
          !panelState.visible && getPanelPosition({ pos, e, defaultSize: panelState.size || PanelDefaultSize, placement: 'right' })
        setPanelState(s => ({
          ...s,
          from,
          type,
          url: webUrl,
          visible: true,
          summaryTarget: type === 'summary' ? query : undefined,
          currentPosition: _pos || s.currentPosition,
          userAgent
        }))
      }
    }
  } as typeof GlobalSearchInstance)
  useShortcut('openSearchPanel', () => {
    setPanelState(s => ({ ...s, visible: !s.visible }))
  })
  return createPortal(<SearchPanel />, document.body)
}

const SearchPanel = () => {
  const instanceRef = useRef<WebpageInstance>()

  const [panelState, setPanelState] = useGlobalAtom(SearchPanelStateAtom)
  const { title, from, summaryTarget } = panelState
  const [currentWebpage, setCurrentWebpage] = useState<IWebpage>()

  const rndRef = useRef<Rnd>()

  useEffect(() => {
    if (instanceRef.current && panelState.url) {
      instanceRef.current.changeUrl(panelState.url)
    }
  }, [panelState.url])

  useEffect(() => {
    rndRef.current?.updateOffsetFromParent()
  }, [panelState.currentPosition])

  return (
    <ResizeAndDrag
      style={{
        background: Colors.Background.Linear,
        padding: '6px 12px',
        borderRadius: 8,
        boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
        zIndex: panelState.visible ? Zindexes.SearchPanel : Number.MIN_SAFE_INTEGER,
        display: 'flex',
        opacity: panelState.visible ? 1 : 0,
        pointerEvents: panelState.visible ? 'auto' : 'none',
        flexDirection: 'column'
      }}
      position={panelState.currentPosition}
      size={panelState.size}
      ref={rndRef}
      onResizeStop={(e, dir, ele, delta, pos) => {
        const bounding = ele.getBoundingClientRect()
        setPanelState(s => ({
          ...s,
          size: {
            width: bounding.width,
            height: bounding.height
          },
          currentPosition: pos
        }))
      }}
      onDragStop={(e, data) => {
        setPanelState(s => ({
          ...s,
          currentPosition: {
            x: data.x,
            y: data.y
          }
        }))
      }}
      className={ClassName.Background.pseudoBlubBackground}
      dragHandleClassName="drag-handle"
    >
      <Content
        flex
        alignItems="center"
        className="drag-handle"
        fullWidth
        gap={20}
        style={{
          paddingLeft: 20,
          cursor: 'grab'
        }}
      >
        <div
          className={css([ClassName.title(FontSize['14px']), ClassName.ellipsisFont(1)])}
          style={{ margin: 'auto', textAlign: 'center', flex: 1, textTransform: 'none' }}
        >
          {title || 'Quick Search Panel'}
        </div>
        <Content flex gap={6} alignItems="center" style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <Button.IconButton
            tooltip="Open In New Tab"
            onClick={async () => {
              if (currentWebpage) {
                const one = await ObjectStore('webpage').addOne(currentWebpage)
                console.log(one)
                Actions.openWebpage(one.id)
              }
            }}
            icon="park-efferent-four"
          ></Button.IconButton>
          <Button.IconButton icon="park-close" onClick={() => setPanelState(s => ({ ...s, visible: false }))}></Button.IconButton>
        </Content>
      </Content>

      <Content fullWidth auto style={{ height: 0, overflow: 'hidden' }}>
        <WebpagePage
          webpageFrom={from}
          navigationStyle={{
            padding: '6px 1px 6px 0px',
            fontSize: FontSize['14px']
          }}
          userAgent="Mozilla/5.0 (Linux; Android 9.0; SAMSUNG SM-F900U Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Mobile Safari/537.36"
          onWebpageChange={i =>
            setCurrentWebpage({
              id: i.webpageId,
              ...i
            })
          }
          onTitleChange={t => setPanelState(s => ({ ...s, title: t }))}
          initialUrl={searchToUrl('')}
          onWebpageInitialized={i => (instanceRef.current = i)}
        />
      </Content>
    </ResizeAndDrag>
  )
}

export default GlobalSearchPanel
