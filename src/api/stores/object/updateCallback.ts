import { ObjectFamily } from '@/api/stores/object/object.store'
import { MetaStore } from '@/api/stores'

export default (prev: Partial<ObjectFamily[keyof ObjectFamily]>, after: ObjectFamily[keyof ObjectFamily]) => {
  if ('selectedText' in prev && prev.selectedText && 'selectedText' in after && after.selectedText) {
    const meta = MetaStore.getMetaObjectByObjectId(after.id)
    if (meta) {
      if (meta.placeholderName !== after.selectedText) {
        MetaStore.updateMetaObject({ id: meta.id, placeholderName: after.selectedText })
      }
    }
  }
}
