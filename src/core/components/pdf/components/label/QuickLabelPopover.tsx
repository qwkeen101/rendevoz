import { memo } from 'react'
import { IPDFLabel } from '~/typings'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { assignProperties } from '@/utils'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useMemoizedFn } from '@/hooks'
import FileSystem from '@/api/fileSystem'
import { getSetting } from '@/core'
import useRenderLabelEditor from '@/core/object/renderer/useRenderLabelEditor'
import Id from '@/utils/id'

export default memo(() => {
  const instance = usePDFInstance()
  const { open, renderPopover, labelDetails, attachTags } = useRenderLabelEditor<IPDFLabel>({
    onInsert: (name, tags) => {
      handleInsertNote(labelDetails, name, tags)
    },
    onCancel: () => {
      if (labelDetails?.type === 'crop') {
        if (labelDetails.imageUrl) {
          FileSystem.fs.deleteFile(labelDetails.imageUrl)
        }
      }
    },
    onClose: () => {
      if (labelDetails?.page !== undefined) {
        instance.values.INDEX_TO_TEXT_LAYER[labelDetails.page]?.clear()
        instance.values.INDEX_TO_PAGE_LAYER[labelDetails.page]?.clearCrop()
      }
    }
  })
  const handleInsertNote = useMemoizedFn(async (details = labelDetails, name?: string, tags?: number[]) => {
    const id = details?.id ?? Id.getId()
    if (details) {
      if (details.id) {
        if (!(await ObjectStore('pdfLabel').getOneById(details.id))) {
          instance.insertLabel?.({ ...details, name, id })
          if (tags) {
            attachTags(id, tags)
          }
        } else {
          const labelMeta = MetaStore.getMetaObjectByObjectId(details.id, true)
          if (labelMeta) {
            MetaStore.updateMetaObject({ id: labelMeta.id, name })
          }
        }
      } else {
        instance.insertLabel?.({ ...details, name, id })
        if (tags) {
          attachTags(id, tags)
        }
      }

      if (details.page !== undefined) {
        instance.values.INDEX_TO_TEXT_LAYER[details.page]?.clear()
        instance.values.INDEX_TO_PAGE_LAYER[details.page]?.clearCrop()
      }
    }
  })
  assignProperties(instance, {
    labelOps: {
      ...instance.labelOps,
      openEditLabelPopover: async (l, pageBounding) => {
        const setting = getSetting()
        if (setting.pdf.autoOpenHighlightEditor === false && !l.id) {
          setTimeout(() => handleInsertNote(labelDetails))
          return
        }
        open(l, pageBounding)
      }
    }
  })
  return renderPopover()
})
