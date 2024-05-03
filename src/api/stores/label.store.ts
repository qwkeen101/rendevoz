import { GlobalInstance } from '@/hooks'

const LabelStore = {
  exportLabels: async (labelIds: number[], type: string) => {
    const labelMetas = await Promise.all(
      labelIds.map(
        async i =>
          await GlobalInstance.metaOps?.addDraggableAsMeta(
            {
              labelId: i,
              type
            },
            true
          )
      )
    )
    GlobalInstance.metaOps?.copyLink(labelMetas.filter(i => i).map(i => i.id))
  }
}

export default LabelStore
