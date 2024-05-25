import { GroupStateAtom, IGroupGrouper } from '@/core/components/group/hooks/useGroupState'
import { IMetaProperty } from '~/typings'
import { IGroupRule } from '~/typings/components/group/property-group'
import { useSelectAtomValue } from '@/hooks'
import SelectGrouperHeader from '@/core/components/group/components/grouper/headers/SelectGrouperHeader'
import { MetaStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import produce from 'immer'
import { useSetAtom } from 'jotai'
import { CSSProperties, ReactElement } from 'react'
import { ClassName } from 'rendevoz'
import { EMPTY_GROUPER_NAME } from '@/core/components/group/hooks/grouper/useBuildGrouper'
import CheckboxGrouperHeader from '@/core/components/group/components/grouper/headers/CheckboxGrouperHeader'
import DateGrouperHeader from '@/core/components/group/components/grouper/headers/DateGrouperHeader'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import NumberGroupHeader from '@/core/components/group/components/grouper/headers/NumberGroupHeader'
import MetaTypeGrouperHeader from '@/core/components/group/components/grouper/headers/MetaTypeGrouperHeader'
import ContainedInGrouperHeader from '@/core/components/group/components/grouper/headers/ContainedInGrouperHeader'

export default function GrouperHeader({
  group,
  style,
  showToggle = true,
  prevNode,
  className,
  showHide
}: {
  group: IGroupGrouper
  showToggle?: boolean
  className?: string
  style?: CSSProperties
  showHide?: boolean
  prevNode?: ReactElement
}) {
  const currentViewGrouper = useSelectAtomValue(GroupStateAtom, s => s.currentView?.group)
  const instance = useGroupInstance()
  const { t } = useTranslation()
  const setGroupState = useSetAtom(GroupStateAtom)
  let fieldType = currentViewGrouper?.fieldType
  if (currentViewGrouper?.propertyGroupType === 'custom') {
    if (currentViewGrouper.propertyId) {
      const prop = MetaStore.getPropDetails(currentViewGrouper.propertyId)
      fieldType = prop?.propType
    }
  }
  if (!currentViewGrouper) {
    return null
  }
  const renderer = () => {
    console.log(fieldType)
    if (group.name === EMPTY_GROUPER_NAME) {
      return <div>{t('general.No value')}</div>
    }
    if (fieldType === 'containedIn') {
      return <ContainedInGrouperHeader canOpen={showToggle} id={Number(group.name)} />
    }
    if (fieldType === 'singleSelect' || fieldType === 'multiSelect') {
      return <SelectGrouperHeader optionId={Number(group.name)} />
    }
    if (fieldType === 'checkbox') {
      return <CheckboxGrouperHeader id={currentViewGrouper.propertyId} checked={group.name === 'true'} />
    }
    if (fieldType === 'date') {
      return <DateGrouperHeader rule={currentViewGrouper} value={group.name} />
    }
    if (fieldType === 'string') {
      return <div className={'ellipsis-font-1'}>{group.name}</div>
    }
    if (fieldType === 'number') {
      return <NumberGroupHeader rule={currentViewGrouper} value={group.name} />
    }
    if (fieldType === 'metaType') {
      return <MetaTypeGrouperHeader value={group.name} />
    }
  }
  const rendered = renderer()
  if (rendered) {
    return (
      <Content
        flex
        className={className}
        gap={12}
        alignItems={'center'}
        style={{
          userSelect: 'none',
          width: '100%',
          padding: '16px 8px 8px',
          zIndex: 50,
          fontWeight: 500,
          fontSize: 14,
          ...style
        }}
      >
        {prevNode}
        {showToggle && (
          <Icon
            theme={'filled'}
            name={'park-right-one'}
            className={ClassName.flatButton(4, '4px')}
            iconStyle={{
              transition: 'inherit',
              transform: group.visible ? 'rotate(90deg)' : undefined
            }}
            onClick={() => {
              setGroupState(w =>
                produce(w, draft => {
                  const g = draft.groups?.find(i => i.id === group.id)
                  if (g) {
                    g.visible = !g.visible
                  }
                })
              )
            }}
          />
        )}
        {rendered}
        {showHide && (
          <Icon
            style={{
              marginLeft: 'auto',
              color: group.hidden ? Colors.Font.SuperTransparent : undefined
            }}
            name={!group.hidden ? 'park-preview-open' : 'park-preview-close'}
            onClick={() => {
              setGroupState(w =>
                produce(w, draft => {
                  const g = draft.groups?.find(i => i.id === group.id)
                  if (g) {
                    g.hidden = !g.hidden
                  }
                })
              )
            }}
            className={ClassName.flatButton(4, '4px')}
          />
        )}
      </Content>
    )
  }
  return null
}
