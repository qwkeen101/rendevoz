import { useEffect, useRef, useState } from 'react'
import { XYPosition } from '~/typings'
import { AnimatePopover, ToolbarV2, WithBorder, defaultRangeExtractor, Range } from '@/components'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { IMediaState } from '@/core/components/media/hooks/useMediaState'
import { useTranslation } from 'react-i18next'
import isHotkey from 'is-hotkey'
import { Icons, KEY } from '@/consts'
import { getSelectionDirection } from '@/utils/text'
import useExplainButton from '@/core/global/components/useExplainButton'
import trans from '@/consts/trans'

type Subtitle = Required<IMediaState>['subtitles'][0]

function getSelectableText() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return ''

  let result = ''

  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i)
    const fragment = range.cloneContents()

    result += extractTextFromNode(fragment)
  }

  return result.trim()
}

function extractTextFromNode(node: Node) {
  console.log(node)
  let text = ''
  if (node.nodeType === Node.TEXT_NODE) {
    text += node.nodeValue
  } else {
    if (isUserSelectable(node)) {
      for (const child of node.childNodes) {
        text += extractTextFromNode(child)
      }
    }
  }

  return text
}

function isUserSelectable(el: Node) {
  if (el instanceof HTMLElement) {
    return !el.hasAttribute('data-nonselect')
  }
  return true
}

const useSubtitleSelectAsLabel = (currentSubtitles?: Required<IMediaState>['subtitles'], showTrans?: boolean) => {
  const instance = useMediaInstance()
  const { t } = useTranslation()
  const [isSelecting, setIsSelecting] = useState(false)
  const [addLabelState, setAddLabelState] = useState<
    | {
        visible: boolean
        position?: XYPosition
        anchorSubtitle?: Subtitle
        anchorIdx?: number
        focusIdx?: number
        focusSubtitle?: Subtitle
        text?: string
      }
    | undefined
  >({
    visible: false
  })
  const containerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const pointerUpHandler = (e: PointerEvent) => {
      setIsSelecting(false)
      if (addLabelState?.visible || !isSelecting) return
      const selection = window.getSelection()
      const container = containerRef.current
      const text = getSelectableText()
      console.log(text)
      if (selection && text && container && currentSubtitles && !selection.isCollapsed) {
        const r = selection.getRangeAt(0)
        const anchor = selection.anchorNode?.parentElement
        const focus = selection.focusNode?.parentElement
        if (anchor && focus && container.contains(anchor) && container.contains(focus)) {
          const range = r
          const direction = getSelectionDirection()
          const bounding = range.getClientRects()[direction === 'down' ? range.getClientRects().length - 1 : 0]
          if (!bounding) return
          const anchorIndex = (anchor as HTMLElement).closest('[data-subtitle-index]')?.getAttribute('data-subtitle-index')
          const focusIndex = (focus as HTMLElement).closest('[data-subtitle-index]')?.getAttribute('data-subtitle-index')
          if (!anchorIndex || !focusIndex) return
          let aI = Number(anchorIndex)
          let fI = Number(focusIndex)
          if (aI > fI) {
            const temp = aI
            aI = fI
            fI = temp
          }
          if (aI >= 0 && fI >= 0) {
            setAddLabelState({
              visible: true,
              anchorIdx: aI,
              focusIdx: fI,
              position: {
                x: direction === 'down' ? bounding.right : bounding.left,
                y: bounding.top
              },
              anchorSubtitle: currentSubtitles[aI],
              focusSubtitle: currentSubtitles[fI],
              text
            })
          }
          return
        }
      }
    }
    const selectionC = (e: PointerEvent) => {
      if (e.target instanceof HTMLElement) {
        if (containerRef.current?.contains(e.target)) {
          setIsSelecting(true)
        }
      }
    }
    const keydownHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Enter, e) && addLabelState?.visible) {
        setAddLabelState(s => ({ ...s, visible: false }))
        setTimeout(() => {
          setAddLabelState(undefined)
        }, 500)
        if (addLabelState?.anchorSubtitle && addLabelState.text) {
          const position = addLabelState.position
          if (!position) return
          e.preventDefault()
          instance.insertLabel?.(
            {
              name: addLabelState.text,
              time: addLabelState.anchorSubtitle.start
            },
            {
              shouldJumpBack: false,
              popoverPosition: { ...position, y: position.y - 16 }
            }
          )
        }
      }
    }
    document.addEventListener('keydown', keydownHandler)
    document.addEventListener('pointerdown', selectionC)
    document.addEventListener('pointerup', pointerUpHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
      document.removeEventListener('pointerup', pointerUpHandler)
      document.removeEventListener('pointerdown', selectionC)
    }
  })

  const rangeExtractor = (range: Range) => {
    if ((isSelecting || addLabelState?.visible) && addLabelState?.anchorIdx !== undefined && addLabelState.focusIdx !== undefined) {
      const arr: number[] = []
      const start = Math.max(0, Math.min(addLabelState.anchorIdx, range.startIndex) - range.overscan)
      const max = Math.min(Math.max(addLabelState.focusIdx, range.endIndex) + range.overscan, range.count - 1)
      for (let i = start; i <= max; i++) {
        arr.push(i)
      }

      console.log(arr)
      return arr
    }
    return defaultRangeExtractor(range)
  }

  const explainItem = useExplainButton({
    onGetExplain: async () => {
      closePopover()
      const text = addLabelState?.text
      if (text) {
        return {
          query: text,
          source: {
            ...(await instance.on?.({
              type: 'getSource'
            })),
            selectedText: text,
            time: addLabelState?.anchorSubtitle?.start
          }
        }
      }
    }
  })
  const closePopover = () => {
    setAddLabelState(s => ({ ...s, visible: false }))
    setTimeout(() => {
      setAddLabelState(undefined)
    }, 500)
  }
  const renderPopover = () => (
    <AnimatePopover
      withClickCover={true}
      visible={!!addLabelState?.visible}
      onClickOutside={() => {
        setAddLabelState(s => ({ ...s, visible: false, anchorIdx: undefined, focusIdx: undefined }))
      }}
      boundaryInset={10}
      padding={10}
      disableNudge={true}
      content={
        <WithBorder className={'!rounded-lg'}>
          <ToolbarV2
            layout={[
              {
                key: 'highlight',
                type: 'button',
                onClick: e => {
                  closePopover()
                  if (addLabelState?.anchorSubtitle && addLabelState.text) {
                    const position = addLabelState.position
                    if (!position) return
                    e.preventDefault()
                    instance.insertLabel?.(
                      {
                        name: addLabelState.text,
                        time: addLabelState.anchorSubtitle.start
                      },
                      {
                        shouldJumpBack: false,
                        popoverPosition: { ...position, y: position.y - 16 }
                      }
                    )
                  }
                },
                text: t('general.Media highlight'),
                icon: 'park-high-light'
              },
              explainItem,
              {
                key: 'translate',
                type: 'button',
                text: t(trans.Translate),
                icon: Icons.Translate,
                onClick: async e => {
                  closePopover()
                  const text = addLabelState?.text
                  if (text) {
                    Global.commonOps?.translate?.({
                      query: text,
                      e,
                      source: {
                        ...(await instance.on?.({
                          type: 'getSource'
                        })),
                        selectedText: text,
                        time: addLabelState?.anchorSubtitle?.start
                      }
                    })
                  }
                }
              }
            ]}
          />
        </WithBorder>
      }
      position={{
        left: addLabelState?.position?.x,
        top: addLabelState?.position?.y
      }}
      positions={['top', 'bottom']}
    ></AnimatePopover>
  )

  return {
    renderPopover,
    containerRef,
    rangeExtractor,
    visible: !!addLabelState?.visible,
    isSelecting
  }
}

export default useSubtitleSelectAsLabel
