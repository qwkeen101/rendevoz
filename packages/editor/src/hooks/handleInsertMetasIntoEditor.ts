import { MetaObject } from '~/typings'
import { GlobalSetting } from '@/core'
import Id from '../../../../utils/id'
import { ObjectStore } from '@/api/stores'
import { noRepeatArray } from '@/utils'

export default (metas: MetaObject[], noteMeta?: MetaObject, inline = true) => {
  const autoBecomeInline = GlobalSetting.getSetting().editor.objectAutoBecomeInline
  if (autoBecomeInline && inline) {
    return [
      {
        type: 'paragraph',
        id: Id.getId(),
        children: metas.map(m => ({
          type: 'inline-metaObject',
          originId: m.id,
          id: Id.getId(),
          children: [{ text: '' }]
        }))
      }
    ]
  } else {
    return metas.map(m => {
      if (m.type === 'syncedBlock') {
        if (m.objectId) {
          ObjectStore('syncedBlock')
            .getOneById(m.objectId)
            .then(o => {
              if (o && noteMeta?.id) {
                ObjectStore('syncedBlock').updateOne({
                  id: o.id,
                  syncedMetaIds: noRepeatArray([noteMeta.id, ...o.syncedMetaIds])
                })
              }
            })
        }
        return {
          type: 'synced',
          originId: m.id,
          syncVersion: 0,
          children: [{ text: '' }],
          id: Id.getId()
        }
      } else {
        return {
          type: 'metaObject',
          originId: m.id,
          id: Id.getId(),
          children: [{ text: '' }]
        }
      }
    })
  }
}
