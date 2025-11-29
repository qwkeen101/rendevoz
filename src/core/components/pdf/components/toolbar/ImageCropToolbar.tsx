import { ToolbarV2 } from '@/components'
import { useEffect } from 'react'
import { Icons, KEY } from '@/consts'
import { useTranslation } from 'react-i18next'
import isHotkey from 'is-hotkey'
import useExplainButton from '@/core/global/components/useExplainButton'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { Box, IPDFLabel } from '~/typings'

export default ({
  imageCrop,
  pageIndex,
  onClose
}: {
  imageCrop?: {
    label: Partial<IPDFLabel & { type: 'crop' }>
    box: Box
  }
  onClose: VoidFunction
  pageIndex: number
}) => {
  const { t } = useTranslation()
  const instance = usePDFInstance()
  const highlight = () => {
    onClose()
    if (imageCrop) {
      instance.labelOps?.openEditLabelPopover(imageCrop.label, imageCrop.box)
    }
  }
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
  const item = useExplainButton({
    onGetExplain: () => {
      onClose()
      instance.values.INDEX_TO_PAGE_LAYER[pageIndex]?.clearCrop()
      const image = imageCrop?.label.imageUrl
      if (image) {
        return {
          image: image,
          targetChatId: instance.aiOps?.getActiveChatId(),
          source: {
            type: 'pdf',
            objectId: instance.getId(),
            page: pageIndex,
            cropLabel: imageCrop.label
          }
        }
      }
    }
  })
  return (
    <ToolbarV2
      layout={[
        {
          key: 'highlight',
          type: 'button',
          text: t('general.Highlight'),
          onClick: () => {
            highlight()
          },
          icon: Icons.Highlight
        },
        item,
        {
          key: 'translate',
          type: 'button',
          text: t('general.Translate'),
          onClick: e => {
            onClose()
            const image = imageCrop?.label.imageUrl
            instance.values.INDEX_TO_PAGE_LAYER[pageIndex]?.clearCrop()
            if (image) {
              Global.commonOps?.translate?.({
                image,
                e,
                targetChatId: instance.aiOps?.getActiveChatId(),
                source: {
                  type: 'pdf',
                  objectId: instance.getId(),
                  page: pageIndex,
                  cropLabel: imageCrop.label
                }
              })
            }
          },
          icon: 'park-translate'
        }
      ]}
    />
  )
}
