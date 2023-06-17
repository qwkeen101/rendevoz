import { useMemoizedFn } from '@/hooks'
import { RefObject, useEffect, useState } from 'react'
import { Size, XYPosition } from '~/typings'
import { IpcWebpageEvent } from './webpageIpcEvent'
import { AnimatePopover, Button, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { MetaStore, ObjectStore } from '@/stores'
import { ObjectDragState } from '@/core/global/globalDragOverlay/useDropObject'
import { GlobalTranslateInstance } from '../global/translate/GlobalTranslatePanel'
import { GlobalSearchInstance } from '../global/GlobalSearchPanel'
import { Zindexes } from '@/consts'
import { transformTextContentToNameAndDescription } from '../global/globalDragOverlay/utils'
import { downloadImg, fetchRemoteImageAndSaveLocally } from '@/utils/img'
import { Rendevoz } from '../rendevoz'

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
    hasImage?: boolean
    currentImageUrl?: string
    altText?: string
    linkText?: string
    linkUrl?: string
  }>({
    visible: false,
    position: { x: 0, y: 0 }
  })
  const { t } = useTranslation()
  const getIcon = Rendevoz.Utils.Object.getMetaObjectIcon
  const { visible, position, selectedText, hasImage, currentImageUrl, altText, linkText, linkUrl } = contextMenuState
  const contextMenuHandler = useMemoizedFn((data: { params: WebpageContextMenuData }) => {
    const { params } = data
    const { selectionText, linkText, linkURL } = params
    console.log(params)
    setContextMenuState(s => ({
      ...s,
      selectedText: selectionText,
      hasImage: params.hasImageContents,
      currentImageUrl: params.srcURL,
      altText: params.altText,
      linkText,
      linkUrl: linkURL
    }))
  })
  const messageHandler = useMemoizedFn(e => {
    if (e.channel === 'event') {
      const event = e.args[0] as IpcWebpageEvent
      switch (event.eventType) {
        case 'click': {
          setContextMenuState(s => ({ ...s, visible: false }))
          webviewRef.current?.stopFindInPage('keepSelection')
          const clickEvent = new MouseEvent('click', {
            clientX: event.bodyX,
            clientY: event.bodyY
            // target: webviewRef.current
          })
          webviewRef.current?.dispatchEvent(clickEvent)
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
          break
        }
        case 'keydown': {
          const keydownEvent = new KeyboardEvent('keydown', {
            ...event
          })
          document.dispatchEvent(keydownEvent)
        }
      }
    }
  })
  const currentWebpageIsMeta = !!(others.webpageId && MetaStore.getMetaObjectByObjectId(others.webpageId))
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
            style={{ display: 'flex', flexDirection: 'column', minWidth: 160 }}
            padding={6}
            onClick={() => setContextMenuState(s => ({ ...s, visible: false }))}
          >
            {linkUrl && (
              <Button.IconButton
                icon="park-add-web"
                text={t('general.open link in new tab')}
                onClick={e => {
                  ObjectStore('webpage')
                    .addOne({
                      title: selectedText || 'Unnamed Webpage',
                      url: linkUrl
                    })
                    .then(one => {
                      Rendevoz.Actions.Open.Webpage.openWebpage(one.id)
                    })
                }}
              />
            )}
            <Button.IconButton
              icon="park-copy"
              text={hasImage ? t('general.copy image') : t('general.copy')}
              onClick={() => {
                if (hasImage) {
                  if (currentImageUrl) {
                    const img = document.createElement('img')
                    img.src = currentImageUrl

                    navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([img.outerHTML], { type: 'text/html' }) })])
                  }
                } else {
                  contextMenuState.selectedText && navigator.clipboard.writeText(contextMenuState.selectedText)
                }
              }}
            />

            {!hasImage && selectedText && (
              <Button.IconButton
                icon="park-translate"
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
            )}
            {hasImage && currentImageUrl && (
              <Button.IconButton
                icon="park-save"
                text={t('general.save locally')}
                onClick={() => {
                  downloadImg(currentImageUrl, altText || currentImageUrl)
                }}
              ></Button.IconButton>
            )}
            <Button.IconButton
              icon="park-search"
              text={t('general.search')}
              onClick={e => {
                // image search bing: https://www.bing.com/images/search?view=detailv2&iss=sbi&form=SBIVSP&sbisrc=UrlPaste&q=imgurl:https%3A%2F%2Fpic4.zhimg.com%2F80%2Fv2-ce5a1ab8992b8fe9cdc3e9f1ba8e1eef_720w.webp&idpbck=1&selectedindex=0&id=https%3A%2F%2Fpic4.zhimg.com%2F80%2Fv2-ce5a1ab8992b8fe9cdc3e9f1ba8e1eef_720w.webp&ccid=afigh7De&mediaurl=https%3A%2F%2Fpic4.zhimg.com%2F80%2Fv2-ce5a1ab8992b8fe9cdc3e9f1ba8e1eef_720w.webp&exph=213&expw=554&vt=2&sim=11
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
            {linkUrl && (
              <Button.IconButton
                icon={getIcon('webpage')}
                text={t('general.generate webpage object from selected link')}
                onClick={async () => {
                  if (contextMenuState.linkUrl) {
                    const from = others.webpageId ? MetaStore.getMetaObjectByObjectId(others.webpageId) : undefined
                    const imagePath = hasImage && currentImageUrl ? await fetchRemoteImageAndSaveLocally(currentImageUrl) : undefined
                    ObjectStore('webpage').addOneWithMeta(
                      {
                        url: linkUrl,
                        title: linkText || 'Unnamed Webpage'
                      },
                      {
                        currentMeta: {
                          name: linkText || 'Unnamed Webpage',
                          coverImgSrc: imagePath,
                          fromObject: from
                            ? {
                                metaId: from.id,
                                type: 'webpage',
                                selectedText: linkText || selectedText
                              }
                            : undefined
                        },
                        showMetaModal: true
                      }
                    )
                  }
                }}
              />
            )}
            {!hasImage && selectedText && (
              <Button.IconButton
                icon={getIcon('note')}
                text={t('general.generate note object from selected text')}
                onClick={() => {
                  if (contextMenuState.selectedText) {
                    const { name, description } = transformTextContentToNameAndDescription(contextMenuState.selectedText)
                    const from = others.webpageId ? MetaStore.getMetaObjectByObjectId(others.webpageId) : undefined
                    ObjectStore('note').addOneWithMeta(
                      {
                        title: name
                      },
                      {
                        currentMeta: {
                          name,
                          description,
                          fromObject: from
                            ? {
                                metaId: from.id,
                                type: 'webpage',
                                selectedText: contextMenuState.selectedText
                              }
                            : undefined
                        },
                        showMetaModal: true
                      }
                    )
                  }
                }}
              />
            )}
            {!hasImage && selectedText && currentWebpageIsMeta && (
              <Button.IconButton
                icon={getIcon('webpageLabel')}
                onClick={() => {
                  if (selectedText) {
                    const { name, description } = transformTextContentToNameAndDescription(contextMenuState.selectedText)
                    const from = others.webpageId ? MetaStore.getMetaObjectByObjectId(others.webpageId) : undefined
                    ObjectStore('webpageLabel').addOneWithMeta(
                      {
                        selectedText,
                        webpageId: others.webpageId
                      },
                      {
                        currentMeta: {
                          name,
                          description,
                          fromObject: from
                            ? {
                                metaId: from.id,
                                type: 'webpage',
                                selectedText
                              }
                            : undefined
                        },
                        showMetaModal: true
                      }
                    )
                  }
                }}
                text={t('general.generate webpagelabel object from selected text')}
              />
            )}
            {hasImage && (
              <Button.IconButton
                text={t('general.generate image object from selected iamge')}
                icon={getIcon('image')}
                onClick={() => {
                  if (currentImageUrl) {
                    fetchRemoteImageAndSaveLocally(currentImageUrl).then(path => {
                      const from = others.webpageId ? MetaStore.getMetaObjectByObjectId(others.webpageId) : undefined
                      ObjectStore('image').addOneWithMeta(
                        {
                          imageUrl: path
                        },
                        {
                          currentMeta: {
                            coverImgSrc: path,
                            name: altText || currentImageUrl,
                            fromObject: from
                              ? {
                                  type: 'webpage',
                                  metaId: from.id,
                                  selectedText: altText
                                }
                              : undefined
                          },
                          showMetaModal: true
                        }
                      )
                    })
                  }
                }}
              />
            )}
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
