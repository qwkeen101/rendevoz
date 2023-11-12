import { AnimatePopover, Button, Content, Icon, IconWithPopover, WithBorder } from '@/components'
import { ObjectStore } from '@/stores'
import { MetaGroup } from '~/typings'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { memo, useEffect, useRef, useState } from 'react'
import { ClassName } from 'rendevoz'
import { useDebounceEffect, useDebounceFn, useSelectAtomValue } from '@/hooks'
import { Colors } from '@/consts'
import GroupSettingMenu from '@/core/group/components/menu/GroupSettingMenu'
import { GroupStateAtom } from '@/core/group/hooks/useGroupState'
import useGroupQueryLibrary from '@/core/group/hooks/queryLibrary/useGroupQueryLibrary'
import { assignProperties } from '@/utils'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import BetterSorter from '@/core/object/filter/BetterSorter'
import { useSetAtom } from 'jotai'
import Id from '@/utils/id'
import { DEFAULT_GROUP_PROPERTIES } from '@/core/group/consts/defaultProperties'
import EmojiWithPicker from '@/components/EmojiWithPicker'
import { useTranslation } from 'react-i18next'
const GroupActions = memo(({ groupId }: { groupId: number }) => {
  const groupData = ObjectStore('group').useValue(groupId) as MetaGroup | undefined
  const currentView = useSelectAtomValue(GroupStateAtom, s => s.currentView)
  const [innerFilter, setInnerFilter] = useState(currentView?.filter)
  const [innerSort, setInnerSort] = useState(currentView?.sort)
  const { renderPanel, open } = useGroupQueryLibrary(groupId)

  const instance = useGroupInstance()
  assignProperties(instance, {
    openFilterPanel: () => open()
  })
  const search = currentView?.search
  const setSearch = (v: string) => {
    instance.updateCurrentView?.(s => ({ ...s, search: v }))
  }
  const padding = useSelectAtomValue(GroupStateAtom, s => s.pagePadding)
  const visibleTypes = useSelectAtomValue(GroupStateAtom, s => s.visibleTypes)
  const [showSearch, setShowSearch] = useState(!!search)
  const isCompo = useRef(false)
  const debounceSet = useDebounceFn(v => setSearch(v), { wait: 500 })
  const existedFilterLength = currentView?.filter?.rules.length ?? 0
  const existedSortLength = currentView?.sort?.sorters.length ?? 0
  const { t } = useTranslation()

  if (!groupData) return null
  return (
    <Content
      flex
      style={{
        padding: `8px ${padding}px`,
        position: 'sticky',
        left: 0,
        fontWeight: 600,
        fontSize: 13
      }}
    >
      {renderPanel()}
      <Content flex gap={4} style={{ overflowX: 'auto', marginRight: 4 }}>
        {groupData.views.map(i => (
          <Content
            flex
            alignItems={'center'}
            key={i.id}
            gap={8}
            style={{
              color: i.id === currentView?.id ? Colors.Font.Primary : Colors.Font.Transparent,
              background: i.id === currentView?.id ? Colors.Background.ButtonHover : undefined,
              flexShrink: 0
            }}
            onClick={() => {
              instance.updateGroupData?.(s => ({ ...s, lastViewId: i.id }))
            }}
            className={ClassName.flatButton()}
          >
            {i.icon ? <EmojiWithPicker emoji={i.icon} style={{ padding: 0 }} /> : <Icon name={'park-table-file'} />}
            <div>{i.name || 'Unnamed view'}</div>
          </Content>
        ))}
      </Content>
      <Icon
        name={'park-plus'}
        className={ClassName.flatButton(4, '6px')}
        onClick={() => {
          instance.updateGroupData?.(s => ({
            ...s,
            views: [
              ...s.views,
              {
                type: 'gallery',
                unToggledIds: [],
                id: Id.getId(),
                name: 'Gallery',
                options: {
                  properties: DEFAULT_GROUP_PROPERTIES
                },
                valueIndex: []
              }
            ]
          }))
        }}
      />
      <Content flex alignItems="center" style={{ flexShrink: 0, marginLeft: 'auto', paddingLeft: 10 }}>
        <AnimatePopover
          positions={['bottom']}
          align="end"
          padding={8}
          onVisiblityChange={v => {
            if (v === false) {
              instance.updateCurrentView?.(s => ({ ...s, filter: innerFilter }))
            }
          }}
          content={
            <WithBorder padding={8}>
              <BetterFilter visibleTypes={visibleTypes} root={currentView?.filter} onChange={v => setInnerFilter(v)} />
            </WithBorder>
          }
        >
          <Button.IconButton
            style={{
              color: existedFilterLength ? Colors.Common.SelectColor : undefined,
              height: 26,
              marginRight: 4
            }}
            icon="park-filter"
            text={t('general.Filter')}
          />
        </AnimatePopover>
        <AnimatePopover
          positions={['bottom']}
          align="end"
          padding={8}
          onVisiblityChange={v => {
            if (v === false) {
              instance.updateCurrentView?.(s => ({ ...s, sort: innerSort }))
            }
          }}
          content={
            <WithBorder padding={8} width={200}>
              <BetterSorter root={currentView?.sort} onChange={v => setInnerSort(v)} />
            </WithBorder>
          }
        >
          <Button.IconButton
            style={{
              color: existedSortLength ? Colors.Common.SelectColor : undefined,
              height: 26,
              marginRight: 4
            }}
            icon="park-sort-one"
            text={t('general.Sort')}
          />
        </AnimatePopover>

        <Icon
          name={'park-search'}
          size={16}
          className={ClassName.circleButton(5, 4)}
          onClick={e => {
            setShowSearch(true)
            e.currentTarget.nextElementSibling?.focus?.()
          }}
        />
        <input
          className={ClassName.noStyleInput}
          defaultValue={search}
          onChange={e => {
            if (!isCompo.current) {
              debounceSet.run(e.target.value)
            }
          }}
          onBlur={e => {
            if (e.currentTarget.value === '') {
              setShowSearch(false)
              setSearch('')
              e.currentTarget.value = ''
            }
          }}
          autoFocus={true}
          placeholder={'Search in group...'}
          onCompositionStart={() => (isCompo.current = true)}
          onCompositionEnd={e => {
            isCompo.current = false
            setSearch(e.currentTarget.value)
          }}
          style={{ width: showSearch ? 150 : 0, transition: 'width 0.3s ease', padding: 0, marginRight: 4 }}
        />
        <IconWithPopover
          size={16}
          renderOnParent={false}
          align={'end'}
          name="park-more"
          className={ClassName.circleButton(5, 4)}
          placement={['bottom']}
          content={setV => (
            <WithBorder padding={6} width={240}>
              <GroupSettingMenu onClose={() => setV(false)} />
            </WithBorder>
          )}
        />
        <Button.IconButton
          text={t('general.Add')}
          onClick={() => {
            open()
          }}
          style={{
            marginLeft: 8,
            padding: '2px 8px',
            color: 'white',
            background: Colors.Common.SelectColor
          }}
        >
          Add
        </Button.IconButton>
      </Content>
    </Content>
  )
})

export default GroupActions
