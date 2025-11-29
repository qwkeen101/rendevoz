import { memo, useLayoutEffect, useRef, useState } from 'react'
import { useGlobalAtomValue, useGlobalSetAtom } from '@/hooks'
import SearchDialog from '@/core/search/SearchDialog'
import { Icon } from '@/components'
import { useTranslation } from 'react-i18next'
import { CollectionStore, MetaStore } from '@/api/stores'
import UseHomeConfig from '@/scenes/home/useHomeConfig'
import { t } from 'i18next'
import trans from '@/consts/trans'
import { compareStrings } from '@/utils'
import fuzzysort from 'fuzzysort'
import { BuiltInSidebarItems } from '@/components/layout/sidebar'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import Workspace from '@/api/common/workspace'
import EmptyList from '@/core/components/common/EmptyList'
import isHotkey from 'is-hotkey'
import { Icons, KEY } from '@/consts'
import classnames from 'classnames'
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed'
import useSearchHistory from '@/core/search/useSearchHistory'
import { getWorkspaceMetaCount } from '@/core/setting/Workspace'
const IconButton = ({
  name,
  desc,
  icon,
  onClick,
  shortcut,
  isSelected,
  onPointerMove,
  image,
  id
}: {
  name: string
  desc?: string
  icon?: string
  id: number | string
  onClick: VoidFunction
  image?: string
  shortcut?: string
  isSelected?: boolean
  onPointerMove: VoidFunction
}) => {
  return (
    <div
      id={id}
      onPointerMove={onPointerMove}
      onClick={onClick}
      className={classnames('p-2 default-transition rounded-lg cursor-pointer flex items-center gap-3', isSelected && 'bg-button-hover')}
    >
      {image ? (
        <img src={image} className={'rounded-lg size-10 object-cover'} />
      ) : icon ? (
        <Icon size={20} name={icon} className={'p-2 border rounded-lg transparent-font'} />
      ) : null}
      <div className={'flex-1'}>
        <div className={desc ? 'font-size-13' : ''}>{name || t(trans.Unnamed)}</div>
        {desc && <div className={'small-transparent'}>{desc}</div>}
      </div>
      {shortcut && <div className={'transparent-font bg-third py-0.5 px-2 font-size-13 rounded-md'}>/{shortcut}</div>}
    </div>
  )
}
export default memo(({ visible, onSearch }: { visible: boolean; onSearch: (s: string) => void }) => {
  const mode = useGlobalAtomValue(SearchDialog.mode)
  const query = useGlobalAtomValue(SearchDialog.search)
  const setMode = useGlobalSetAtom(SearchDialog.mode)
  const { t } = useTranslation()
  const { history } = useSearchHistory()
  const modeToTranslation: Record<typeof mode, string> = {
    new: t('general.New file'),
    workspace: t('general.Switch workspace'),
    view: t(trans.RecentlyViewed),
    create: t(trans.RecentlyCreated),
    page: t('general.Open page'),
    folder: t('general.View folders'),
    search: t('general.Actions'),
    history: t('general.Search history')
  }
  const [results, setResults] = useState<
    {
      text: string
      shortcut?: string
      icon?: string
      onSelect: VoidFunction
      desc?: string
      image?: string
      id: string | number
    }[]
  >([])
  const [selected, setSelected] = useState<number | string>()
  useLayoutEffect(() => {
    if (visible) {
      const keyHandler = (e: KeyboardEvent) => {
        if (isHotkey(KEY.ArrowUp, e)) {
          let currentIdx = Math.max(
            results.findIndex(i => i.id === selected),
            0
          )
          if (currentIdx === 0) {
            currentIdx = results.length - 1
          } else {
            currentIdx -= 1
          }
          console.log(currentIdx, results.length)
          setSelected(results[currentIdx].id)
        }
        if (isHotkey(KEY.ArrowDown, e)) {
          let currentIdx = Math.max(
            results.findIndex(i => i.id === selected),
            -1
          )
          if (currentIdx === results.length - 1) {
            currentIdx = 0
          } else {
            currentIdx += 1
          }
          setSelected(results[currentIdx].id)
        }
        if (isHotkey(KEY.Enter, e)) {
          if (selected) {
            results.find(i => i.id === selected)?.onSelect?.()
          }
        }
      }
      document.addEventListener('keydown', keyHandler)
      return () => {
        document.removeEventListener('keydown', keyHandler)
      }
    }
  }, [visible, results, selected])

  useLayoutEffect(() => {
    setSelected(results[0]?.id)
  }, [results])
  useLayoutEffect(() => {
    const action = async () => {
      let res: typeof results = []
      if (mode === 'search') {
        res = [
          {
            text: modeToTranslation['new'],
            id: 'new',
            icon: 'park-plus',
            onSelect: () => {
              setMode('new')
            },
            shortcut: 'n'
          },
          {
            text: modeToTranslation['page'],
            id: 'page',
            icon: 'park-page',
            onSelect: () => {
              setMode('page')
            },
            shortcut: 'p'
          },
          {
            text: modeToTranslation['folder'],
            id: 'folder',
            icon: Icons.Folder,
            onSelect: () => {
              setMode('folder')
            },
            shortcut: 'f'
          },
          {
            text: modeToTranslation['workspace'],
            id: 'workspace',
            icon: 'park-switch',
            onSelect: () => {
              setMode('workspace')
            },
            shortcut: 'w'
          },
          {
            text: modeToTranslation['create'],
            id: 'create',
            icon: 'park-newlybuild',
            onSelect: () => {
              setMode('create')
            },
            shortcut: 'c'
          },
          {
            text: modeToTranslation['view'],
            id: 'view',
            icon: 'park-preview-open',
            onSelect: () => {
              setMode('view')
            },
            shortcut: 'v'
          }
        ]
        if (history.length) {
          res.unshift({
            text: modeToTranslation['history'],
            id: 'history',
            icon: Icons.History,
            onSelect: () => {
              setMode('history')
            },
            shortcut: 'h'
          })
        }
      }
      if (mode === 'new') {
        res = [
          ...['note', 'whiteboard', 'group', 'chat', 'exam'].map(i => ({
            text: Global.utils.getTypeName(i),
            icon: Global.utils.getIcon(i),
            id: i,
            onSelect: () => {
              Global.metaOps.createObjects?.(
                i,
                () => {
                  Global.searchOps?.closeSearchPanel?.()
                },
                { openAfterTriggerOnce: true }
              )
            }
          })),
          {
            text: t('general.Local file'),
            icon: 'park-file-addition-one',
            id: 'file',
            onSelect: () => {
              Global.metaOps.openUploaderTab?.('file')
            }
          },
          {
            text: t('general.Import from url'),
            icon: 'park-upload-web',
            id: 'web',
            onSelect: () => {
              Global.metaOps.openUploaderTab?.('url')
            }
          }
        ]
      }
      if (mode === 'folder') {
        const allCollections = CollectionStore.getAll()
        res = allCollections
          .map(i => ({
            desc: [
              `${t('filter.Created at')} ${DateFormat.formatTime(i.createdAt)}`,
              i.items.filter(i => i.type === 'collection'),
              i.items.filter(i => i.type === 'meta' && MetaStore.isVisibleMetaObject(i.id, { showHidden: true, showLabel: true }))
            ]
              .filter(i => i.length > 0)
              .map(i => {
                if (typeof i === 'string') return i
                if (i[0].type === 'collection') {
                  return `${i.length} ${t('general.Folders')}`
                } else {
                  return `${i.length} ${t('general.files')}`
                }
              })
              .join(' • '),
            id: i.id,
            text: `/${CollectionStore.buildPath(i.id)}`,
            icon: Global.utils.getIcon('collection'),
            onSelect: () => {
              const parent = CollectionStore.findParentCollections(i.id)
              if (parent) {
                Global.searchOps?.closeSearchPanel?.()
                UseHomeConfig.update(c => ({ ...c, breadcrumbsFutureStack: [], breadcrumbs: parent.map(i => i.id) }))
                Global.layoutOps?.openPage('home')
              }
            }
          }))
          .sort((a, b) => compareStrings(a.text, b.text))
      }
      if (mode === 'page') {
        res = Array.from(Object.values(BuiltInSidebarItems))
          .filter(i => i.key !== 'search')
          .map(i => ({
            text: i.text?.() || '',
            id: i.key,
            onSelect: () => {
              i.onClick?.()
              Global.searchOps?.closeSearchPanel()
            },
            icon: i.icon
          }))
      }
      if (mode === 'workspace') {
        const workspaces = KeyvalueStore.getOne('allWorkspaces') || []
        const count = await getWorkspaceMetaCount()
        res = [
          ...workspaces.map(i => ({
            text: i.name,
            id: i.id,
            icon: 'custom-card-library',
            desc: `${t('general.File count')}: ${count.get(i.id) ?? 0}`,
            onSelect: () => {
              Global.searchOps?.closeSearchPanel()
              Workspace.switchWorkspace(i.id)
            }
          })),
          {
            text: t('settings.New workspace'),
            id: 'new',
            icon: 'park-plus',
            onSelect: () => {
              Workspace.addWorkspace().then(id => {
                Workspace.switchWorkspace(id)
              })
              Global.searchOps?.closeSearchPanel()
            }
          }
        ]
      }
      if (mode === 'create') {
        const all = MetaStore.getAll({
          sort: 'createdAtDsc',
          showHidden: true
        })
        res = all
          .map(i => ({
            text: i.name || '',
            desc: Global.utils.getTypeName(i.type),
            icon: Global.utils.getIcon(i.type),
            id: i.id,
            image: i.coverImgSrc,
            onSelect: () => {
              Global.searchOps?.closeSearchPanel()
              Global.layoutOps?.openObject(i.id)
            }
          }))
          .slice(0, 50)
      }
      if (mode === 'view') {
        const all = MetaStore.getAll({
          sort: 'viewAtDsc',
          showHidden: true
        })
          .filter(i => i.viewAt)
          .slice(0, 50)
        res = all.map(i => ({
          text: i.name || '',
          id: i.id,
          image: i.coverImgSrc,
          desc: Global.utils.getTypeName(i.type),
          icon: Global.utils.getIcon(i.type),
          onSelect: () => {
            Global.searchOps?.closeSearchPanel()
            Global.layoutOps?.openObject(i.id)
          }
        }))
      }
      if (mode === 'history') {
        res = history.map(i => ({
          text: i || '',
          id: i,
          icon: Icons.History,
          onSelect: () => {
            onSearch(i)
          }
        }))
      }
      if (query && !query.startsWith('/')) {
        res = fuzzysort
          .go(query, res, {
            key: 'text',
            threshold: -10000
          })
          .map(i => i.obj)
        if (mode === 'workspace') {
          res = res.filter(i => i.id !== 'new')
          res.push({
            text: `${t('settings.New workspace')}: ${query}`,
            id: 'new',
            icon: 'park-plus',
            onSelect: () => {
              Workspace.addWorkspace(query).then(id => {
                Workspace.switchWorkspace(id)
              })
              Global.searchOps?.closeSearchPanel()
            }
          })
        }
      }
      setResults(res)
    }
    action()
  }, [mode, query, visible])
  const containerRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (selected) {
      const ele = containerRef.current
      if (ele) {
        const target = ele.querySelector(`[id="${selected}"]`)
        if (target) {
          scrollIntoViewIfNeeded(target, { scrollMode: 'if-needed' })
        }
      }
    }
  }, [selected])
  return (
    <div className={'p-2 overflow-y-auto min-h-96'} ref={containerRef}>
      <div className={'small-transparent pl-2 mb-1'}>{modeToTranslation[mode]}</div>
      {results.map(i => (
        <IconButton
          key={i.id}
          isSelected={selected === i.id}
          shortcut={i.shortcut}
          name={i.text}
          image={i.image}
          onClick={i.onSelect}
          desc={i.desc}
          onPointerMove={() => setSelected(i.id)}
          icon={i.icon}
          id={i.id}
        />
      ))}
      {!results.length ? <EmptyList className={'min-h-96'} /> : null}
    </div>
  )
})
