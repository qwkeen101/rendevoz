import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useMemo } from 'react'
import { MetaStore } from '@/api/stores'
import { Button, Content } from '@/components'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { DEFAULT_GROUP_PROPERTIES, DEFAULT_GROUP_PROPERTY_OBJ } from '@/core/components/group/consts/defaultProperties'
import { useTranslation } from 'react-i18next'
import GrouperTextBy from '@/core/components/group/components/grouper/menus/GrouperTextBy'
import GrouperReorder from '@/core/components/group/components/grouper/menus/GrouperReorder'
import GrouperSortMenu from '@/core/components/group/components/grouper/menus/GrouperSortMenu'
import GrouperDateBy from '@/core/components/group/components/grouper/menus/GrouperDateBy'
import { DateSort, NumberSort, StringSort } from '~/typings/components/group/property-group'
import GroupNumberBy from '@/core/components/group/components/grouper/menus/GroupNumberBy'
import DEFAULT_GROUPER from '@/core/components/group/components/grouper/consts/DEFAULT_GROUPER'

type SubMenu = 'Sort by' | 'Group by' | 'Text by' | 'Date by' | 'Number by'
export default function GroupGrouperMenu({
  onSubMenu,
  currentSub,
  onBack
}: {
  onSubMenu: (m: SubMenu) => void
  currentSub?: SubMenu
  onBack: VoidFunction
}) {
  const instance = useGroupInstance()
  const { t } = useTranslation()
  let visibleProperties = useSelectAtomValue(GroupStateAtom, s => s.visibleProperties)
  const currentGroupRule = useSelectAtomValue(GroupStateAtom, s => s.currentView?.group)
  const currentViewType = useSelectAtomValue(GroupStateAtom, s => s.currentView?.type)
  if (currentViewType === 'gallery' || currentViewType === 'list') {
    if (!visibleProperties.some(i => i.id === 2)) {
      visibleProperties = [DEFAULT_GROUP_PROPERTY_OBJ[2], ...visibleProperties]
    }
  }
  const groupableProperties = useMemo(() => {
    const groupable = visibleProperties.filter(i => {
      if (i.type === 'basic') {
        const prop = DEFAULT_GROUP_PROPERTY_OBJ[i.id]
        if (prop) {
          if ('propType' in prop) {
            return true
          }
        }
      }
      if (i.type === 'custom') {
        const prop = MetaStore.property.getPropDetails(i.id)
        switch (prop?.propType) {
          case 'singleSelect':
          case 'string':
          case 'number':
          case 'multiSelect':
          case 'checkbox':
          case 'date':
            return true
        }
      }
      return false
    })
    const results = groupable.map(i => {
      if (i.type === 'basic') {
        return { ...DEFAULT_GROUP_PROPERTY_OBJ[i.id], name: t(i.display) }
      }
      return { ...MetaStore.property.getPropDetails(i.id), type: 'custom' }
    })
    results.unshift({
      type: 'custom',
      propType: 'containedIn',
      name: t('filter.Contained in'),
      icon: 'park-hamburger-button'
    })
    return results
  }, [visibleProperties])
  console.log(groupableProperties, currentSub)
  const sortableGroups = ['string', 'date', 'number', 'singleSelect', 'multiSelect']
  if (!currentGroupRule || currentSub === 'Group by') {
    return (
      <Content style={{ padding: '0px 0.25rem 0.4rem', maxHeight: 450, overflowY: 'auto' }}>
        {groupableProperties.map(
          i =>
            i && (
              <Button.IconButton
                text={i.name}
                icon={i.icon}
                onClick={() => {
                  let sort: StringSort | DateSort | NumberSort = undefined
                  if ('propType' in i) {
                    switch (i.propType) {
                      case 'string':
                      case 'singleSelect':
                      case 'multiSelect':
                        sort = 'alphabetical'
                        break
                      case 'date':
                        sort = 'newestFirst'
                        break
                      case 'number':
                        sort = 'ascending'
                        break
                    }
                  }
                  instance.updateCurrentView?.(w => ({
                    ...w,
                    group: {
                      propertyId: i.id,
                      propertyGroupType: i.type,
                      fieldType: i.propType,
                      sort,
                      dateBy: DEFAULT_GROUPER.DATE_BY,
                      textBy: DEFAULT_GROUPER.TEXT_BY,
                      groupRange: DEFAULT_GROUPER.GROUP_RANGE,
                      groupEvery: DEFAULT_GROUPER.GROUP_EVERY
                    }
                  }))
                  setTimeout(() => {
                    onBack()
                  }, 30)
                }}
                key={i.id}
              >
                {i.name}
              </Button.IconButton>
            )
        )}
      </Content>
    )
  }
  if (currentSub === 'Text by') {
    return <GrouperTextBy onBack={onBack} />
  }
  if (currentSub === 'Sort by') {
    return <GrouperSortMenu onBack={onBack} />
  }
  if (currentSub === 'Date by') {
    return <GrouperDateBy onBack={onBack} />
  }
  if (currentSub === 'Number by') {
    return <GroupNumberBy />
  }
  let groupPropertyName = ''
  if (currentGroupRule.propertyGroupType === 'basic' && currentGroupRule.propertyId) {
    const display = DEFAULT_GROUP_PROPERTIES.find(i => i.id === currentGroupRule.propertyId)?.display
    if (display) {
      groupPropertyName = t(display)
    }
  }
  if (currentGroupRule.propertyGroupType === 'custom' && currentGroupRule.propertyId) {
    const prop = MetaStore.property.getPropDetails(currentGroupRule.propertyId)
    if (prop) {
      groupPropertyName = prop.name
    }
  }
  return (
    <Content style={{ maxHeight: '450px', overflowY: 'auto' }}>
      <div
        style={{
          width: '100%',
          padding: '0px 0.25rem'
        }}
      >
        <Button.IconButton
          onClick={() => onSubMenu('Group by')}
          text={t('general.Group by')}
          suffixStr={groupPropertyName}
          suffixIcon={'park-right'}
        />
        {currentGroupRule.fieldType === 'string' && (
          <Button.IconButton
            onClick={() => onSubMenu('Text by')}
            text={t('general.Text by')}
            suffixStr={'textBy' in currentGroupRule ? t(`general.${currentGroupRule.textBy || 'exact'}`) : undefined}
            suffixIcon={'park-right'}
          />
        )}
        {currentGroupRule.fieldType === 'date' && (
          <Button.IconButton
            onClick={() => onSubMenu('Date by')}
            text={t('general.Date by')}
            suffixStr={'dateBy' in currentGroupRule ? t(`general.${currentGroupRule.dateBy || 'relative'}`) : undefined}
            suffixIcon={'park-right'}
          />
        )}
        {currentGroupRule.fieldType === 'number' && (
          <Button.IconButton onClick={() => onSubMenu('Number by')} text={t('general.Number by')} suffixIcon={'park-right'} />
        )}
        {sortableGroups.includes(currentGroupRule.fieldType) && (
          <Button.IconButton
            onClick={() => onSubMenu('Sort by')}
            text={t('general.Sort by')}
            suffixStr={'sort' in currentGroupRule ? t(`general.${currentGroupRule.sort || 'manual'}`) : undefined}
            suffixIcon={'park-right'}
          />
        )}
      </div>
      <GrouperReorder />
      {currentViewType !== 'kanban' && (
        <div style={{ padding: '4px', marginTop: 4 }} className={'border-top'}>
          <Button.IconButton
            icon={'park-delete-one'}
            text={t('general.Remove grouping')}
            dangerous
            onClick={() => {
              instance.updateCurrentView?.(w => ({ ...w, group: undefined }))
            }}
          />
        </div>
      )}
    </Content>
  )
}
