import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { DateSort, StringSort, NumberSort } from '~/typings/components/group/property-group'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useTranslation } from 'react-i18next'
import { ClassName } from 'rendevoz'

export default ({ onBack }: { onBack: VoidFunction }) => {
  const currentGrouper = useSelectAtomValue(GroupStateAtom, s => s.currentView?.group)
  const instance = useGroupInstance()
  const { t } = useTranslation()
  if (!currentGrouper) {
    return null
  }
  switch (currentGrouper.fieldType) {
    case 'string': {
      const sorts: StringSort[] = ['manual', 'alphabetical', 'reverseAlphabetical']
      return (
        <div style={{ padding: '0px 4px 4px' }}>
          {sorts.map(i => (
            <div
              onClick={() => {
                instance.updateCurrentView?.(w => ({ ...w, group: { ...w.group, sort: i } }))
                onBack?.()
              }}
              key={i}
              className={ClassName.flatButton()}
            >
              {t(`general.${i}`)}
            </div>
          ))}
        </div>
      )
    }
    case 'date': {
      const sorts: DateSort[] = ['newestFirst', 'oldestFirst']
      return (
        <div style={{ padding: '0px 4px 4px' }}>
          {sorts.map(i => (
            <div
              className={ClassName.flatButton()}
              onClick={() => {
                instance.updateCurrentView?.(w => ({ ...w, group: { ...w.group, sort: i } }))
                onBack?.()
              }}
              key={i}
            >
              {t(`general.${i}`)}
            </div>
          ))}
        </div>
      )
    }
    case 'number': {
      const sorts: NumberSort[] = ['ascending', 'descending']
      return (
        <div style={{ padding: '0px 4px 4px' }}>
          {sorts.map(i => (
            <div
              className={ClassName.flatButton()}
              onClick={() => {
                instance.updateCurrentView?.(w => ({ ...w, group: { ...w.group, sort: i } }))
                onBack?.()
              }}
              key={i}
            >
              {t(`general.${i}`)}
            </div>
          ))}
        </div>
      )
    }
  }
  return null
}
