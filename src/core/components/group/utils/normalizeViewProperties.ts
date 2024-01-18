import { IGroupInstance, MetaGroup, MetaGroupProperty } from '~/typings'
import produce from 'immer'
import { DEFAULT_GROUP_PROPERTIES } from '@/core/components/group/consts/defaultProperties'
import { ObjectStore } from '@/api/stores'

export default (groupData: MetaGroup, instance: IGroupInstance, extraProps?: MetaGroupProperty[]) => {
  const basicProps = groupData.properties?.filter(i => i.type === 'basic')
  const defaultBasics = Object.fromEntries([...DEFAULT_GROUP_PROPERTIES, ...(extraProps || [])].map(i => [i.id, i]))
  const basicRecord = Object.fromEntries((basicProps || []).map(i => [i.id, i]))
  const plusDefaultProps: Record<string, any> = {}
  Object.keys(defaultBasics).forEach(key => {
    if (!basicRecord[key]) {
      plusDefaultProps[key] = defaultBasics[key]
    }
  })
  if (
    !groupData.properties ||
    Object.keys(plusDefaultProps).length > 0 ||
    groupData.views.some(i => !i.options.properties || Object.keys(i.options.properties).length < (groupData.properties?.length ?? 0))
  ) {
    console.log('trigger')
    const newData = produce(groupData, draft => {
      const props = [...(draft.properties || []), ...Object.values(plusDefaultProps)]
      draft.properties = props
      draft.views.forEach(v => {
        v.options.properties = Object.fromEntries(
          props.map((i, idx) => [
            i.id,
            {
              width: v.options?.properties?.[i.id]?.width ?? i.width ?? 150,
              visible: v.options?.properties?.[i.id]?.visible ?? i.visible,
              order: v.options?.properties?.[i.id]?.order ?? idx
            }
          ])
        )
      })
    })
    instance.updateGroupData?.(() => newData)
  }
}
