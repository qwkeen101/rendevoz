import { memo, useLayoutEffect, useState } from 'react'
import { MetaFilterGroup, MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { BetterInput, CheckBox, Content, FormFooter, Icon, IconWithPopover, WithBorder } from '@/components'
import { useDebounceEffect } from '@/hooks'
import { Icons, KEY } from '@/consts'
import { useTranslation } from 'react-i18next'
import isHotkey from 'is-hotkey'
import trans from '@/consts/trans'
import BetterFilter from '@/core/object/filter/BetterFilter'
import classnames from 'classnames'
import EmptyList from '@/core/components/common/EmptyList'
import { atom } from 'jotai/index'
import { useAtom } from 'jotai'

const GroupMoveToAtom = atom<{
  search: string
  filter?: MetaFilterGroup
  selected: number[]
  expanded: Set<number>
}>({
  search: '',
  selected: [],
  expanded: new Set<number>()
})
export default memo(
  ({ showHidden = false, onClose, onChange }: { onChange: (ids: number[]) => void; onClose: VoidFunction; showHidden?: boolean }) => {
    const [{ selected, search, filter }, setCache] = useAtom(GroupMoveToAtom)
    const { t } = useTranslation()
    const metas = MetaStore.useAll()
    const [groups, setGroups] = useState<MetaObject[]>([])
    const calculateGroups = async () => {
      let all = MetaStore.getAll({
        showHidden,
        filter: o => o.type === 'group',
        sort: 'createdAtDsc'
      })
      if (search) {
        all = await Global.metaOps.search(search, all)
      }
      if (filter?.rules.length) {
        all = await Global.metaOps.filter(filter, all)
      }
      setGroups(all)
    }
    useDebounceEffect(
      () => {
        calculateGroups()
      },
      [search, filter],
      { wait: 200 }
    )
    useLayoutEffect(() => {
      calculateGroups()
    }, [metas])
    return (
      <Content
        flex
        column
        style={{
          minWidth: 'min(540px, 90vw)',
          maxWidth: 'min(800px, 90vw)'
        }}
      >
        <div className={'flex items-center bg-third gap-3 py-2 px-4'}>
          <Icon name={Icons.Search} />
          <BetterInput
            placeholder={t('general.Type to search') + '...'}
            onKeyDownCapture={e => {
              if (isHotkey(KEY.Escape, e)) {
                e.preventDefault()
                e.stopPropagation()
                e.currentTarget.blur()
              }
            }}
            className={'flex-1'}
            value={search}
            onChange={v => setCache(s => ({ ...s, search: v.target.value }))}
          />
        </div>
        <div className={'flex px-4 items-center py-1.5 font-size-12 gap-3 transparent-font'}>
          <div style={{ width: 16 }}></div>
          <div className={'flex-1'}>{t(trans.Name)}</div>
          <div style={{ width: '30%' }}>{t(trans.CreatedAt)}</div>
        </div>
        {groups.length ? (
          <div className={'overflow-y-auto min-h-64 px-2 pb-2'}>
            {groups?.map(i => (
              <Item
                id={i.id}
                key={i.id}
                selected={selected}
                onClick={id => {
                  setCache(s => ({ ...s, selected: s.selected.includes(id) ? s.selected.filter(o => o !== id) : [...s.selected, id] }))
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyList className={'py-20'} />
        )}
        <FormFooter
          onCancel={onClose}
          canConfirm={selected.length > 0}
          className={'border-top p-4'}
          onConfirm={() => {
            // remove selected when confirm
            setCache(s => ({ ...s, selected: [] }))
            onChange(selected)
          }}
        />
      </Content>
    )
  }
)

const Item = ({ id, onClick, selected }: { id: number; selected: number[]; onClick: (id: number) => void }) => {
  const group = MetaStore.useValue(id)
  const { t } = useTranslation()
  if (!group || group.deleted) return null
  const isSelected = selected.includes(id)
  return (
    <div onClick={() => onClick(id)} className={'flex button items-center !py-2 gap-3'}>
      <CheckBox checked={isSelected} />
      <div className={classnames('flex-1', !group.name ? 'super-transparent-font' : undefined)}>{group.name || t(trans.Unnamed)}</div>
      <div
        style={{
          width: '30%'
        }}
        className={'font-size-11 whitespace-nowrap transparent-font'}
      >
        {DateFormat.formatTime(group.createdAt, { showMinute: true })}
      </div>
    </div>
  )
}
