import { ToolbarV2 } from '@/components'
import { FC, useEffect } from 'react'
import { KEY } from '@/consts'
import { useTranslation } from 'react-i18next'
import isHotkey from 'is-hotkey'
import useExplainButton from '@/core/global/components/useExplainButton'
import { SelectedTextEvent } from '~/typings'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import material from 'material-colors'
interface TextSelectionToolbarProps {
  textSelect?: SelectedTextEvent
  onClose: VoidFunction
  pageIndex: number
}
const colors = ['#f5d576', material.red['300'], material.blue['300'], material.green['200'], material.purple['200']]
const TextSelectionToolbar: FC<TextSelectionToolbarProps> = ({ pageIndex, textSelect, onClose }) => {
  const defaultLabelColor = '#f5d576'
  const { t } = useTranslation()
  const instance = usePDFInstance()
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      setTimeout(() => {
        if (!e.defaultPrevented) {
          if (isHotkey(KEY.Enter, e)) {
            highlight()
          }
        }
      })
    }
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [])
  const getTextSelectRects = () => {
    if (!textSelect || !textSelect.rects) return
    return textSelect.rects.map(r => ({
      percentageTop: parseFloat(r.percentageTop?.toFixed(4) || '0'),
      percentageHeight: parseFloat(r.percentageHeight?.toFixed(4) || '0'),
      percentageLeft: parseFloat(r.percentageLeft?.toFixed(4) || '0'),
      percentageWidth: parseFloat(r.percentageWidth?.toFixed(4) || '0')
    }))
  }
  const highlight = (color?: string) => {
    onClose()
    if (!textSelect || !textSelect.rects) return
    instance.labelOps?.openEditLabelPopover(
      {
        page: pageIndex,
        selectedText: textSelect?.selectedText,
        type: 'highlight',
        color: color ?? defaultLabelColor,
        rects: getTextSelectRects()
      },
      {
        left: textSelect.e.clientX,
        top: textSelect.e.clientY + 4,
        width: 0,
        height: 0
      },
      'bottom'
    )
  }
  const item = useExplainButton({
    onGetExplain: () => {
      onClose()
      if (textSelect?.selectedText) {
        const rects = getTextSelectRects()
        if (rects) {
          return {
            targetChatId: instance.aiOps?.getActiveChatId(),
            query: textSelect.selectedText,
            source: {
              type: 'pdf',
              objectId: instance.getId(),
              page: pageIndex,
              selectedText: textSelect.selectedText,
              rects
            }
          }
        }
      }
    }
  })
  return (
    <ToolbarV2
      layout={[
        item,
        {
          key: 'translate',
          type: 'button',
          text: t('general.Translate'),
          onClick: e => {
            onClose()
            if (textSelect?.selectedText) {
              const rects = getTextSelectRects()
              if (rects) {
                Global.commonOps?.translate?.({
                  query: textSelect.selectedText,
                  e,
                  targetChatId: instance.aiOps?.getActiveChatId(),
                  source: {
                    type: 'pdf',
                    objectId: instance.getId(),
                    page: pageIndex,
                    selectedText: textSelect.selectedText,
                    rects
                  }
                })
              }
            }
          },
          icon: 'park-translate'
        },
        {
          type: 'separator',
          key: 's-1'
        },
        ...colors.map(c => ({
          key: `highlight-${c}`,
          type: 'button',
          element: (
            <div onClick={() => highlight(c)} className={'square-button'}>
              <div
                style={{
                  borderRadius: '50%',
                  background: c,
                  width: 17,
                  height: 17,
                  opacity: 0.7
                }}
              ></div>
            </div>
          )
        }))
      ]}
    />
  )
}

export default TextSelectionToolbar
