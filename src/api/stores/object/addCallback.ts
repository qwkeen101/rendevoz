import { ObjectFamily } from '@/api/stores/object/object.store'
import { GlobalInstance } from '@/hooks'
import { getSetting } from '@/core'
import useRenderLabelEditor from '@/core/object/renderer/useRenderLabelEditor'
import { MetaStore } from '@/api/stores'

export default (o: ObjectFamily[keyof ObjectFamily]) => {
  if (GlobalInstance.objectOps?.isLabel(o)) {
    if (!('id' in o) || !('specType' in o)) return
    GlobalInstance.metaOps
      ?.addDraggableAsMeta(
        {
          type: o.specType,
          labelId: o.id
        },
        true
      )
      .then(i => {
        if (i.objectId && useRenderLabelEditor.attachedTags[i.objectId]) {
          const tags = useRenderLabelEditor.attachedTags[i.objectId]
          if (tags?.length) {
            MetaStore.updateMetaObject({ id: i.id, tags })
          }
          delete useRenderLabelEditor.attachedTags[i.objectId]
        }
      })
  }
}
