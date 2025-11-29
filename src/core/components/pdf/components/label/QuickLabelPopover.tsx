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
        const pageFuncs = instance.getPageFuncs(labelDetails.page)
        if (pageFuncs) {
          pageFuncs.clearCrop()
          pageFuncs.clearTextSelect?.()
        }
      }
    }
  })
  const handleInsertNote = useMemoizedFn(async (details = labelDetails, name?: string, tags?: number[]) => {
    const id = details?.id ?? Id.getId()
    const imagePath = details?.imageUrl?.includes('base64') ? await FileSystem.saveImage(details?.imageUrl) : undefined
    if (details) {
      if (details.id) {
        if (!(await ObjectStore('pdfLabel').getOneById(details.id))) {
          instance.insertLabel?.({ ...details, imageUrl: imagePath ?? details.imageUrl, name, id })
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
        instance.insertLabel?.({ ...details, imageUrl: imagePath ?? details.imageUrl, name, id })
        if (tags) {
          attachTags(id, tags)
        }
      }

      if (details.page !== undefined) {
        const pageFuncs = instance.getPageFuncs(details.page)
        if (pageFuncs) {
          pageFuncs.clearCrop()
          pageFuncs.clearTextSelect?.()
        }
      }
    }
  })
  assignProperties(instance, {
    labelOps: {
      ...instance.labelOps,
      openEditLabelPopover: async (l, pageBounding, direction) => {
        const setting = getSetting()
        if (setting.pdf.autoOpenHighlightEditor === false && !l.id) {
          setTimeout(() => handleInsertNote(l))
          return
        }
        open(l, pageBounding, direction)
      }
    }
  })
  return renderPopover()
})
