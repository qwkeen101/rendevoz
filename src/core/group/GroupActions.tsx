import { AnimatePopover, Button, Content, Icon, IconWithPopover, WithBorder } from '@/components'
import { globalStore, MetaStore, ObjectStore } from '@/stores'
import { MetaGroup } from '~/typings'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ClassName } from 'rendevoz'
import fuzzysort from 'fuzzysort'
import { useDebounceEffect, useDebounceFn } from '@/hooks'

const GroupActions = ({ groupId }: { groupId: number }) => {
  const groupData = ObjectStore('group').useValue(groupId) as MetaGroup | undefined
  const [innerFilter, setInnerFilter] = useState(groupData?.filter)
  const [innerSort, setInnerSort] = useState(groupData?.sort)
  const search = groupData?.search
  const setSearch = (v: string) => {
    ObjectStore('group').updateOne({ id: groupId, search: v })
  }
  const [showSearch, setShowSearch] = useState(!!search)
  const isCompo = useRef(false)
  const debounceSet = useDebounceFn(v => setSearch(v), { wait: 500 })
  if (!groupData) return null
  return (
    <Content flex justifyContent={'space-between'}>
      <Content></Content>
      <Content flex style={{ fontSize: 12 }} alignItems="center">
        <AnimatePopover
          positions={['bottom']}
          align="end"
          onVisiblityChange={v => {
            if (v === false) {
              ObjectStore('group').updateOne({ id: groupId, filter: innerFilter })
            }
          }}
          content={
            <WithBorder padding={8}>
              <BetterFilter root={groupData.filter} onChange={v => setInnerFilter(v)} />
            </WithBorder>
          }
        >
          <Button.IconButton
            style={{
              padding: '4px 6px',
              lineHeight: 1.2,
              marginRight: 6
            }}
            icon="park-filter"
            text={'Filter'}
          />
        </AnimatePopover>
        <Button.IconButton
          style={{
            padding: '4px 6px',
            lineHeight: 1.2,
            marginRight: 6
          }}
          icon="park-filter"
          text={'Sort'}
        />
        <Icon name={'park-search'} className={ClassName.circleButton(5, 4)} onClick={() => setShowSearch(true)} />
        <input
          className={ClassName.noStyleInput}
          defaultValue={search}
          onChange={e => {
            if (!isCompo.current) {
              debounceSet.run(e.target.value)
            }
          }}
          autoFocus={true}
          placeholder={'Search objects in group'}
          onCompositionStart={() => (isCompo.current = true)}
          onCompositionEnd={e => {
            isCompo.current = false
            setSearch(e.currentTarget.value)
          }}
          style={{ width: showSearch ? 150 : 0, transition: 'width 0.3s ease' }}
        />
        {showSearch && <Icon name={'park-close'} onClick={() => setShowSearch(false)} size={12} style={{ cursor: 'pointer' }} />}
        <IconWithPopover
          size={12}
          name="park-more"
          className={ClassName.circleButton(5, 4)}
          placement={['bottom']}
          containerStyle={{ marginLeft: 6 }}
          content={
            <WithBorder padding={6} style={{ fontSize: 12 }}>
              <Button.IconButton
                text={'Wrap columns'}
                enabled={groupData.tableProperties?.wrapColumns}
                onClick={() => {
                  ObjectStore('group').updateOne({
                    id: groupId,
                    tableProperties: { ...groupData?.tableProperties, wrapColumns: !groupData?.tableProperties?.wrapColumns }
                  })
                }}
              />
            </WithBorder>
          }
        />
      </Content>
    </Content>
  )
}

export default GroupActions
