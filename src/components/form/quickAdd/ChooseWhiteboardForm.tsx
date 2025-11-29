import { memo, useLayoutEffect, useMemo, useState } from 'react'
import { MetaFilterGroup, MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { BetterInput, Icon } from '@/components'
import { Whiteboard } from '@/core'
import { useTranslation } from 'react-i18next'
import { Icons, KEY } from '@/consts'
import { useDebounceEffect } from '@/hooks'
import isHotkey from 'is-hotkey'
import useCollectionMetaTreeView, { ITreeView } from '@/core/components/common/useCollectionMetaTreeView'
import { SidebarExpandItem } from '@/components/layout/sidebar/main'
import EmptyList from '@/core/components/common/EmptyList'
import { atom } from 'jotai/index'
import { useAtom } from 'jotai'
import produce from 'immer'

const WhiteboardMoveToAtom = atom<{
  expanded: Set<number>
  search: string
  filter?: MetaFilterGroup
  selected?: number
}>({
  expanded: new Set<number>(),
  search: '',
  filter: undefined
})

export default memo(({ showHidden = false }: { showHidden: boolean }) => {
  const [whiteboards, setWhiteboards] = useState<MetaObject[]>([])
  const [{ search, expanded, filter, selected }, setCache] = useAtom(WhiteboardMoveToAtom)
  const metas = MetaStore.useAll()
  const calculateWhiteboards = async () => {
    let all = MetaStore.getAll({
      showHidden: true,
      filter: o => o.type === 'whiteboard',
      sort: 'createdAtDsc'
    })
    if (search) {
      all = await Global.metaOps.search(search, all, { onlyName: true, showHidden })
    }
    if (filter?.rules.length) {
      all = await Global.metaOps.filter(filter, all)
    }
    setWhiteboards(all)
  }
  useLayoutEffect(() => {
    calculateWhiteboards()
  }, [metas])
  useDebounceEffect(
    () => {
      calculateWhiteboards()
    },
    [search, filter],
    { wait: 300 }
  )
  const { view } = useCollectionMetaTreeView({ showHidden, id: useMemo(() => whiteboards.map(i => i.id), [whiteboards]) })
  const { t } = useTranslation()
  const renderSidebar = () => {
    return (
      <div className={'flex-col flex w-64 h-full border-right'}>
        <div className={'flex items-center transparent-font bg-third gap-3 py-1.5 px-3'}>
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
            className={'flex-1 font-size-13'}
            value={search}
            onChange={v => setCache(s => ({ ...s, search: v.target.value }))}
          />
        </div>
        <div className={'overflow-y-auto flex-1 p-2'}>
          {view.map(i => (
            <Item
              {...i}
              key={i.id}
              expanded={expanded}
              onClick={id => {
                setCache(s => ({ ...s, selected: id }))
              }}
              onExpand={id => {
                setCache(s =>
                  produce(s, draft => {
                    draft.expanded.has(id) ? draft.expanded.delete(id) : draft.expanded.add(id)
                  })
                )
              }}
              selected={selected}
            />
          ))}
        </div>
      </div>
    )
  }
  const objectId = selected ? MetaStore.getCachedMetaObject(selected)?.objectId : undefined
  return (
    <div
      className={'border-top relative overflow-hidden flex'}
      style={{ width: '90vw', height: '80vh', minWidth: 800, borderRadius: '0px 0px 12px 12px' }}
    >
      {renderSidebar()}
      <div className={'flex-1 h-full bg-global items-center flex justify-center relative overflow-hidden'}>
        {objectId ? <Whiteboard key={objectId} whiteboardId={objectId} /> : <EmptyList />}
      </div>
    </div>
  )
})

const Item = ({
  name,
  children,
  id,
  type,
  onExpand,
  expanded,
  selected,
  onClick
}: ITreeView & {
  expanded: Set<number>
  selected?: number
  onClick: (id: number) => void
  onExpand: (id: number) => void
}) => {
  return (
    <>
      <SidebarExpandItem
        name={name}
        expandable={type === 'collection'}
        onExpand={() => {
          onExpand(id)
        }}
        expanded={expanded.has(id)}
        className={selected === id ? 'select-color-box-shadow select-color-super-transparent-bg' : ''}
        onClick={() => {
          if (type === 'collection') {
            onExpand(id)
          } else {
            onClick(id)
          }
        }}
        icon={type === 'collection' ? Icons.Folder : undefined}
        childrenSize={children.length}
      />
      {type === 'collection' && children.length && expanded.has(id) ? (
        <div className={'pl-6'}>
          {children.map(i => (
            <Item {...i} selected={selected} onExpand={onExpand} expanded={expanded} onClick={onClick} key={i.id} />
          ))}
        </div>
      ) : null}
    </>
  )
}
