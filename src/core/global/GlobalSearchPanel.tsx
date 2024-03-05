import { useEffect, useRef } from 'react'
import { GlobalInstances, MetaObject, XYPosition } from '~/typings'
import { Rnd } from 'react-rnd'
import { atom } from 'jotai'
import { useGlobalAtom, useShortcut } from '@/hooks'
import { Content } from '@/components'
import { getPanelPosition } from './utils'
import { ObjectStore } from '@/api/stores'
import { searchToUrl } from '../components/webpage/utils'
import { setPanelState as setSidebarPanelState } from '@/components/layout/sidebar'
import WebviewWepbage from '@/core/components/webpage/WebviewWepbage'

export const GlobalSearchInstance: Partial<GlobalInstances.WebSearchInstance> = {}

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
          !panelState.visible &&
          getPanelPosition({
            pos,
            e,
            defaultSize: panelState.size || PanelDefaultSize,
            placement: 'right'
          })

        setSidebarPanelState(s => {
          s.visible.clear()
          s.visible.add('webSearch')
          s.leftOpen = true
        })
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
    setSidebarPanelState(s => {
      s.visible.has('webSearch') ? s.visible.delete('webSearch') : s.visible.add('webSearch')
    })
    setPanelState(s => ({ ...s, visible: !s.visible }))
  })
}

export const SearchPanel = () => {
  const [panelState, setPanelState] = useGlobalAtom(SearchPanelStateAtom)
  const { from } = panelState

  const rndRef = useRef<Rnd>()

  useEffect(() => {
    rndRef.current?.updateOffsetFromParent()
  }, [panelState.currentPosition])

  return (
    <Content flex column fullWidth fullHeight>
      <Content fullWidth auto style={{ height: 0, overflow: 'hidden' }}>
        <WebviewWepbage
          onUrlChange={s => {
            setPanelState(d => ({ ...d, url: s }))
          }}
          onAddAsMeta={result => {
            ObjectStore('webpage').addOneWithMeta(
              {
                url: result.url
              },
              {
                currentMeta: {
                  fromObject: from
                }
              }
            )
          }}
          userAgent={
            'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
          }
          url={panelState.url || 'https://google.com'}
        />
      </Content>
    </Content>
  )
}

export default GlobalSearchPanel
