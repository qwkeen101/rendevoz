import { IGroupGrouper, IMetaGroupGrouper, MetaObject } from '~/typings'
import { ReactNode } from 'react'
import { MetaStore } from '@/api/stores'
import { LabelDetailsContext } from '@/core/object/renderer/LabelDetailsContext'

export default ({ group, children }: { group: IGroupGrouper; children: ReactNode }) => {
  const meta = MetaStore.useValue(Number(group.name) as number)
  const hideTypes = ['note', 'webpage', 'audio', 'video', 'pdf'] as MetaObject['type'][]
  return (
    <LabelDetailsContext.Provider
      value={{
        showSource: meta && hideTypes.includes(meta.type) ? false : true,
        showAddNote: false
      }}
    >
      {children}
    </LabelDetailsContext.Provider>
  )
}
