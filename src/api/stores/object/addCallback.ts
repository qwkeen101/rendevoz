import { ObjectFamily } from '@/api/stores/object/object.store'
import useRenderLabelEditor from '@/core/object/renderer/useRenderLabelEditor'
import { MetaStore, ObjectStore } from '@/api/stores'
import { GlobalSetting } from '@/core'
import OcrService from '@/api/services/ocr.service'
import UserService from '@/api/services/user.service'

export default (o: ObjectFamily[keyof ObjectFamily]) => {
  if (Global.objectOps?.isLabel(o)) {
    if (!('id' in o) || !('specType' in o)) return
    if (o.specType === 'pdfLabel') {
      if (o.imageUrl) {
        const autoExtractText = GlobalSetting.getSetting().pdf.autoExtractText
        if (autoExtractText) {
          if (UserService.isUserPro(true)) {
            OcrService.ocrImage(o.imageUrl).then(res => {
              ObjectStore('pdfLabel').updateOne({ id: o.id, selectedText: res })
            })
          }
        }
      }
    }
    Global.metaOps
      .addDraggableAsMeta({
        type: 'label',
        labelId: o.id
      })
      .then(([i]) => {
        if (!i) return
        if (i.objectId && useRenderLabelEditor.attachedTags[i.objectId]) {
          const tags = useRenderLabelEditor.attachedTags[i.objectId]
          if (tags?.length) {
            MetaStore.updateMetaObject({ id: i.id, tags })
          }
          delete useRenderLabelEditor.attachedTags[i.objectId]
        }
        if (i.objectId && useRenderLabelEditor.labelNeedMoveTo) {
          useRenderLabelEditor.labelNeedMoveTo = false
          Global.metaOps.quickAdd?.(i.id)
        }
      })
  }
}
