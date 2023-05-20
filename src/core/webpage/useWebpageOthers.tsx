import { useMemoizedFn } from '@/hooks'
import { RefObject, useEffect, useState } from 'react'
import { Size, XYPosition } from '~/typings'
import { IpcWebpageEvent } from './webpageIpcEvent'
import { AnimatePopover, Button, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { MetaStore } from '@/stores'
import { ObjectDragState } from '@/core/global/globalDragOverlay/useDropObject'
import { GlobalTranslateInstance } from '../global/GlobalTranslatePanel'
import { GlobalSearchInstance } from '../global/GlobalSearchPanel'
import { Zindexes } from '@/consts'

type WebpageContextMenuData = {
  x: number
  y: number
  linkURL: string
  linkText: string
  pageURL: string
  frameURL: string
  srcURL: string
  mediaType: string
  hasImageContents: boolean
  isEditable: boolean
  selectionText: string
  titleText: string
  altText: string
  suggestedFilename: string
  selectionRect: XYPosition & Size
  menuSourceType: 'none' | 'mouse' | 'keyboard' | 'touch' | 'longPress'
}

const useWebpageOthers = (
  webviewRef: RefObject<HTMLWebViewElement>,
  others: {
    webpageId?: number
  }
) => {
  const [contextMenuState, setContextMenuState] = useState<{
    visible: boolean
    position?: XYPosition
    selectedText?: string
  }>({
    visible: false,
    position: { x: 0, y: 0 }
  })
  const { t } = useTranslation()
  const { visible, position, selectedText } = contextMenuState
  const contextMenuHandler = useMemoizedFn((data: { params: WebpageContextMenuData }) => {
    const { params } = data
    const { selectionText } = params
    setContextMenuState(s => ({ ...s, selectedText: selectionText }))
  })
  const messageHandler = useMemoizedFn(e => {
    if (e.channel === 'event') {
      const event = e.args[0] as IpcWebpageEvent
      switch (event.eventType) {
        case 'click': {
          setContextMenuState(s => ({ ...s, visible: false }))
          webviewRef.current?.stopFindInPage('keepSelection')
          break
        }
        case 'contextmenu': {
          const { x, y } = event

          const containerBounding = webviewRef.current?.getBoundingClientRect()
          const menuX = x + (containerBounding?.x || 0)
          const menuY = y + (containerBounding?.y || 0)
          setContextMenuState(s => ({
            ...s,
            position: {
              x: menuX,
              y: menuY
            },
            visible: true
          }))

          break
        }
        case 'drop': {
          ObjectDragState.dragFrom = undefined
          ObjectDragState.metaId = undefined
          break
        }
        case 'dragstart': {
          const { data } = event
          if (data.length) {
            if (others.webpageId) {
              const meta = MetaStore.getMetaObjectByObjectId(others.webpageId)

              if (meta) {
                Object.assign(ObjectDragState, {
                  dragFrom: 'webpage',
                  metaId: meta.id
                })
              }
            }
          }
        }
      }
    }
  })

  useEffect(() => {
    const webview = webviewRef.current
    if (webview) {
      webview.addEventListener('context-menu', contextMenuHandler)
      webview.addEventListener('ipc-message', messageHandler)
    }
    return () => {
      webview?.removeEventListener('context-menu', contextMenuHandler)
      webview?.removeEventListener('ipc-message', messageHandler)
    }
  }, [])

  const renderContextMenu = () => {
    return (
      <AnimatePopover
        visible={visible}
        position={{
          left: position?.x || 0,
          top: position?.y || 0
        }}
        disableIntersection
        disableNudge
        align="start"
        padding={10}
        containerStyle={{ zIndex: String(Zindexes.SearchPanel + 1) }}
        content={
          <WithBorder
            style={{ display: 'flex', flexDirection: 'column' }}
            padding={6}
            onClick={() => setContextMenuState(s => ({ ...s, visible: false }))}
          >
            <Button.IconButton
              text={t('general.copy')}
              onClick={() => {
                contextMenuState.selectedText && navigator.clipboard.writeText(contextMenuState.selectedText)
              }}
            />
            <Button.IconButton
              text={t('general.translate')}
              onClick={e => {
                selectedText &&
                  GlobalTranslateInstance.open?.({
                    e,
                    query: selectedText,
                    to: 'zh',
                    source: others.webpageId
                      ? {
                          type: 'webpage',
                          objectId: others.webpageId
                        }
                      : undefined
                  })
              }}
            />
            <Button.IconButton
              text={t('general.search')}
              onClick={e => {
                const meta = others.webpageId && MetaStore.getMetaObjectByObjectId(others.webpageId)
                // webviewRef.current.findInPage?.(selectedText)
                selectedText &&
                  GlobalSearchInstance.open?.({
                    e,
                    query: selectedText,
                    from: meta
                      ? {
                          type: 'webpage',
                          metaId: meta.id,
                          selectedText
                        }
                      : undefined
                  })
              }}
            />
          </WithBorder>
        }
        reposition
        positions={['right', 'top']}
      ></AnimatePopover>
    )
  }

  return {
    renderContextMenu
  }
}

export default useWebpageOthers
