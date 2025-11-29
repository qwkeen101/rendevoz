import { ObjectStore } from '@/api/stores/index'

const LabelStore = {
  exportLabels: async (labelIds: number[], type: string) => {
    const existedIds: number[] = []
    await Promise.all(
      labelIds.map(async id => {
        const one = await ObjectStore(type).getOneById(id)
        if (one) {
          existedIds.push(id)
        }
      })
    )
    if (!existedIds.length) return
    const labelMetas = await Promise.all(
      existedIds.map(
        async i =>
          (
            await Global.metaOps.addDraggableAsMeta({
              labelId: i,
              type: 'label'
            })
          )[0]
      )
    )
    Global.metaOps.copyLink(labelMetas.filter(i => i).map(i => i.id))
  }
}

export default LabelStore
