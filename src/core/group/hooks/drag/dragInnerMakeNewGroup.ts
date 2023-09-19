import { MetaGroupChild } from '~/typings'
import { globalStore, GroupStore, MetaStore, ObjectStore } from '@/stores'
import i18next from 'i18next'

const dragInnerMakeNewGroup = async (details: { targetValue: MetaGroupChild }) => {
  const { targetValue } = details
  if (targetValue.type === 'metaObject') {
    const lang = i18next.language
    const targetMetaObject = await MetaStore.getMetaObjectById(targetValue.id)
    const targetMetaHasGroup = GroupStore.getGroupByMetaId(targetValue.id)
    if (targetMetaHasGroup) {
      return
    } else {
      const initializedGroup = GroupStore.initializeGroup()
      const { one, meta } = await ObjectStore('group').addOneWithMeta(
        {
          belongsTo: targetValue.id,
          ...initializedGroup
        },
        {
          currentMeta: {
            name: lang === 'zh-CN' ? `${targetMetaObject?.name}的组` : `${targetMetaObject?.name}'s group`
          }
        }
      )
    }
  }
}

export default dragInnerMakeNewGroup
