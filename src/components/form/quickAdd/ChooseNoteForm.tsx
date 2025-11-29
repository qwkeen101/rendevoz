import { BetterInput, Icon, IconWithPopover, WithBorder } from '@/components'
import { memo, useLayoutEffect, useMemo, useState } from 'react'
import { MetaFilterGroup, MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import produce from 'immer'
import { Icons, KEY } from '@/consts'
import { useTranslation } from 'react-i18next'
import { atom } from 'jotai/index'
import { useAtom } from 'jotai'
import isHotkey from 'is-hotkey'
import { useDebounceEffect } from '@/hooks'
import useCollectionMetaTreeView, { ITreeView } from '@/core/components/common/useCollectionMetaTreeView'
import { SidebarExpandItem } from '@/components/layout/sidebar/main'
import NoteEditor from '@/core/components/editor/noteEditor/NoteEditor'
import EmptyList from '@/core/components/common/EmptyList'

const NoteMoveToAtom = atom<{
  search: string
  filter?: MetaFilterGroup
  selected?: number
  expanded: Set<number>
}>({
  expanded: new Set<number>(),
  search: ''
})
export default memo(({ showHidden = false }: { showHidden: boolean }) => {
  const [{ search, filter, selected, expanded }, setCache] = useAtom(NoteMoveToAtom)
  const { t } = useTranslation()
  const [notes, setNotes] = useState<MetaObject[]>([])
  const allMetas = MetaStore.useAll()
  const calculateNotes = async () => {
    let all = MetaStore.getAll({
      showHidden: true,
      filter: o => o.type === 'note',
      sort: 'createdAtDsc'
    })
    if (search) {
      all = await Global.metaOps.search(search, all, { onlyName: true, showHidden })
    }
    if (filter?.rules.length) {
      all = await Global.metaOps.filter(filter, all)
    }
    setNotes(all)
  }
  useLayoutEffect(() => {
    calculateNotes()
  }, [allMetas])

  useDebounceEffect(
    () => {
      calculateNotes()
    },
    [search, filter],
    { wait: 200 }
  )
  const { view } = useCollectionMetaTreeView({ showHidden, id: useMemo(() => notes.map(i => i.id), [notes]) })
  const selectedNote = MetaStore.useValue(selected)
  return (
    <div className={'flex border-top'} style={{ width: 'min(1400px, 90vw)', minWidth: '550px', height: 'min(80vh, 1000px)' }}>
      <div className={'flex flex-col h-full border-right w-64'}>
        <div className={'flex items-center bg-third gap-3 py-1.5 px-3'}>
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
        <div className={'flex-1 overflow-y-auto p-2'}>
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
      <div className={'flex-1 flex items-center justify-center'}>
        {selectedNote ? (
          <NoteEditor key={selectedNote.objectId} layout={{ showHeader: false }} noteId={selectedNote.objectId} metaId={selectedNote.id} />
        ) : (
          <EmptyList />
        )}
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
