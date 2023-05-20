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
import { objectStore } from '@/stores/object.store'
import getSetting from '../setting/getSetting'
import { detectLanguage } from '@/utils/text'
import { getPanelPosition } from './utils'
import ResizeAndDrag from '@/components/base/ResizeAndDrag'
import { ObjectStore } from '@/stores'

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
      const setting = getSetting()
      let webUrl = url
      let type: 'searchEngine' | 'summary' = 'searchEngine'
      const userAgent =
        'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
      const defaultSearchEngine = setting.general.defaultSearchEngine
      switch (defaultSearchEngine) {
        case 'google': {
          webUrl = 'https://google.com/search?q=' + query?.trim().replaceAll(' ', '+')
          break
        }
        case 'google scholar': {
          webUrl = 'https://scholar.google.com/scholar?q=' + query?.trim().replaceAll(' ', '+')
          break
        }
        case 'wikipedia': {
          let lang = 'en'
          if (query) {
            lang = detectLanguage(query) || 'en'
          }
          webUrl = `https://${lang}.wikipedia.org/w/index.php?fulltext=1&profile=advanced&search=${query?.trim()}`
          break
        }
        case 'baidu': {
          webUrl = 'https://www.baidu.com/s?&wd=' + query?.trim().replaceAll(' ', '+')
          break
        }
        case 'vocabulary': {
          webUrl =
            'https://www.vocabulary.com/dictionary/' +
            query
              ?.trim()
              .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g, ' ')
              .trim()
              .toLowerCase()
          break
        }
        case 'bing': {
          webUrl = 'https://www.bing.com/search?q=' + query?.trim().replaceAll(' ', '+')
          break
        }
        case 'bing dictionary': {
          webUrl = `https://www.bing.com/dict/search?q=${query?.trim().replaceAll(' ', '+')}&go=Search`
          break
        }
        case 'zhihu': {
          webUrl = `https://www.zhihu.com/search?q=${query?.trim()}&type=content`
          break
        }
        case 'wiki summary': {
          type = 'summary'
          break
        }
        case 'semantic scholar': {
          webUrl = `https://www.semanticscholar.org/search?q=${query?.trim()}&sort=relevance`
          break
        }
        case 'youdao dictionary': {
          webUrl = `https://www.youdao.com/m/result?word=${query?.trim()}&lang=en`
          break
        }
      }
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
  const { url, title, from, summaryTarget } = panelState
  const [initialWebpageId, setInitialWebpageId] = useState<number>()
  const [currentWebpage, setCurrentWebpage] = useState<IWebpage>()

  const rndRef = useRef<Rnd>()
  useEffect(() => {
    if (!initialWebpageId && panelState.url) {
      objectStore('webpage')
        .addOne({
          url: panelState.url
        })
        .then(one => {
          setInitialWebpageId(one.id)
          setCurrentWebpageId(one.id)
        })
    }
    if (instanceRef.current && panelState.url) {
      instanceRef.current.changeUrl(panelState.url)
    }
  }, [panelState.url])
  useEffect(() => {
    if (summaryTarget) {
      console.log(summaryTarget)
      detectLanguage(summaryTarget).then(res => {
        const code = res.data
        if (code) {
          const encodedQuery = encodeURIComponent(summaryTarget?.trim().replaceAll(' ', '_'))
          fetch(`https://${code}.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`)
            .then(result => {
              if (result.status === 404) {
                fetch(`https://${code}.wikipedia.org/w/api.php?action=opensearch&search=${encodedQuery}&namespace=0&format=json`)
              } else {
                return result.json()
              }
            })
            .then(data => {
              if (data.type === 'disambiguation') {
                fetch(`https://${code}.wikipedia.org/w/api.php?action=opensearch&search=${encodedQuery}&namespace=0&format=json`)
              }
            })
        }
      })
    }
  }, [summaryTarget])
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
        zIndex: Zindexes.SearchPanel,
        display: panelState.visible ? 'flex' : 'none',
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
          style={{ margin: 'auto', textAlign: 'center', flex: 1 }}
        >
          {title}
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
      {initialWebpageId && (
        <Content fullWidth auto style={{ height: 0, overflow: 'hidden' }}>
          <WebpagePage
            webpageFrom={from}
            navigationStyle={{
              padding: '6px 0px',
              fontSize: FontSize['14px']
            }}
            userAgent={panelState.userAgent}
            onWebpageChange={i =>
              setCurrentWebpage({
                id: i.webpageId,
                ...i
              })
            }
            onTitleChange={t => setPanelState(s => ({ ...s, title: t }))}
            initialWebpageId={initialWebpageId}
            onWebpageInitialized={i => (instanceRef.current = i)}
          />
        </Content>
      )}
    </ResizeAndDrag>
  )
}

export default GlobalSearchPanel
