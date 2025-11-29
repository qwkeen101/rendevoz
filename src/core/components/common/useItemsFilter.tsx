import { CSSProperties, useEffect, useRef } from 'react'
import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import fuzzysort from 'fuzzysort'
import { IBase } from '~/typings'
import { urlToIdMap } from '@/api/indexData/urlToId'
import { atom } from 'jotai/index'
import { useAtomValue } from 'jotai/react'
import { BetterInput, Icon, IconWithPopover, Menu, WithBorder } from '@/components'
import { Icons, KEY } from '@/consts'
import isHotkey from 'is-hotkey'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import useUpdateIsomorphicLayoutEffect from '@/hooks/utils/useUpdateIsomorphicLayoutEffect'
import useItemsGrouper from '@/core/components/common/useItemsGrouper'
import { getObjectById } from '@/api/stores/object/object.store'
import { useDebounceEffect } from '@/hooks'

export const ItemFilterCacheAtom = atom<
  Record<
    number | string,
    {
      query?: string
      searchResults?: number[]
      searchVisible?: boolean
      filter?: 'all' | 'isObject' | 'hasHighlight' | string
      filterResults?: number[]
    }
  >
>({})
export default function <T extends IBase>(
  currItems: number[] | undefined,
  key: number | string,
  opts: {
    searchKeys: string[]
    itemType: string
    getURL: (v: T) => string
    filters?: {
      isObject?: boolean
      hasHighlight?: boolean
    }
    customFilters?: { value: string; text: string }[]
    getCustomFilter?: (v: string, items: T[]) => Promise<number[]>
    grouperOpts: Omit<Parameters<typeof useItemsGrouper>[1], 'items' | 'itemType' | 'getURL'>
  }
) {
  const { itemType, searchKeys, getURL, customFilters, getCustomFilter } = opts
  const state = useAtomValue(ItemFilterCacheAtom)[key] ?? {}
  const setState = (updater: (curr: typeof state) => typeof state) => {
    globalStore.set(ItemFilterCacheAtom, {
      ...globalStore.get(ItemFilterCacheAtom),
      [key]: updater(state)
    })
  }
  const { renderGrouperChooser, state: groupState } = useItemsGrouper<T>(key, {
    items: state.filterResults || currItems,
    itemType: opts.itemType,
    getURL,
    ...opts.grouperOpts
  })
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (state.searchVisible) {
      inputRef.current?.focus()
    }
  }, [state.searchVisible])
  const { t } = useTranslation()
  const ids = groupState.results || state.filterResults || currItems
  const calculateSearch = async () => {
    const { query } = state
    if (!query) {
      setState(s => ({ ...s, searchResults: undefined }))
      return
    }
    const allItems = await ObjectStore(itemType).getMultipleByIds(ids)
    const res = fuzzysort
      .go(query, allItems, {
        keys: searchKeys,
        threshold: -100000
      })
      .map(i => i.obj.id)
    setState(s => ({ ...s, searchResults: res }))
  }
  useDebounceEffect(
    () => {
      calculateSearch()
    },
    [state.query],
    { wait: 200 }
  )
  useUpdateIsomorphicLayoutEffect(() => {
    if (state.query) {
      calculateSearch()
    }
  }, [ids])
  useUpdateIsomorphicLayoutEffect(() => {
    if (!state.filter || state.filter === 'all') {
      if (state.filterResults) {
        setState(s => ({ ...s, filterResults: undefined }))
      }
      return
    }
    const action = async () => {
      if (!currItems?.length) {
        setState(s => ({ ...s, filterResults: [] }))
        return
      }
      let allItems = (await ObjectStore(itemType).getMultipleByIds(currItems)) as (T & {
        object?: boolean
      })[]
      if (!allItems.length) {
        setState(s => ({ ...s, filterResults: [] }))
        return
      }
      if (state.filter === 'isObject' || state.filter === 'hasHighlight') {
        const map = globalStore.get(urlToIdMap)
        allItems = await Promise.all(
          allItems.map(async i => {
            const object = map.get(getURL(i))
            if (!object) {
              return i
            }
            const meta = MetaStore.getMetaObjectByObjectId(object)
            if (!meta || meta.deleted || meta.temp) return i
            return {
              ...i,
              object: true
            }
          })
        )
        allItems = allItems.filter(i => i.object)
      }
      if (state.filter === 'hasHighlight') {
        const hasHighlight = new Set<number>()
        const map = globalStore.get(urlToIdMap)
        await Promise.all(
          allItems.map(async i => {
            if (i) {
              const objectId = map.get(getURL(i))
              if (objectId) {
                const item = await getObjectById(objectId)
                if (item && 'labels' in item && item.labels?.length) {
                  hasHighlight.add(i.id)
                }
              }
            }
          })
        )
        allItems = allItems.filter(i => i && hasHighlight.has(i.id))
      }
      if (state.filter && getCustomFilter && state.filter !== 'hasHighlight' && state.filter !== 'isObject') {
        const ids = await getCustomFilter(state.filter, allItems)
        if (ids) {
          const idSet = new Set(ids)
          allItems = allItems.filter(i => idSet.has(i.id))
        }
      }
      setState(s => ({
        ...s,
        filterResults: allItems.map(i => i.id)
      }))
    }
    action()
  }, [state.filter, currItems])

  const renderSearch = (opts?: {
    placeholder?: string
    style?: CSSProperties
    className?: 'small' | 'large'
    autoFocus?: boolean
    containerClassName?: string
    alwaysVisible?: boolean
  }) => {
    return (
      <div className={classnames('flex items-center', opts?.containerClassName)}>
        <Icon
          onClick={() => {
            setState(s => ({ ...s, searchVisible: !s.searchVisible }))
          }}
          onPointerDown={e => e.preventDefault()}
          name={Icons.Search}
          size={18}
          className={'rounded-lg-button'}
        />
        <BetterInput
          ref={inputRef}
          autoFocus={opts?.autoFocus}
          placeholder={opts?.placeholder ?? t(trans.Search)}
          className={opts?.className}
          defaultValue={state.query}
          onBlur={() => {
            if (!state.query) {
              setState(s => ({ ...s, searchVisible: false }))
            }
          }}
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              calculateSearch()
            }
            if (isHotkey(KEY.Escape, e)) {
              e.currentTarget.blur()
              setState(s => ({ ...s, searchVisible: false }))
            }
          }}
          onChange={e => setState(s => ({ ...s, query: e.target.value }))}
          style={{
            width: state.searchVisible || opts?.alwaysVisible ? 180 : 0,
            transition: 'all 0.3s ease',
            opacity: state.searchVisible || opts?.alwaysVisible ? 1 : 0,
            marginLeft: state.searchVisible || opts?.alwaysVisible ? '0.75rem' : undefined,
            ...opts?.style
          }}
        />
      </div>
    )
  }
  const renderFilter = () => (
    <IconWithPopover
      size={16}
      name={Icons.Filter}
      className={classnames(
        'transition-colors',
        state.filter && state.filter !== 'all' ? 'select-color-font' : 'transparent-font hover-primary-color'
      )}
      placement={['bottom', 'top']}
      content={setV => (
        <WithBorder className={'popover-menu-mid'}>
          <Menu.NavigationMenu
            defaultSelected={[state.filter ?? 'all']}
            onSelect={item => {
              setV(false)
              setState(s => ({ ...s, filter: item.key }))
            }}
            layout={[
              {
                type: 'title',
                name: t('general.Filter')
              },
              ...[
                {
                  value: 'all',
                  children: t(trans.Feed.all)
                },
                ...(opts.customFilters?.map(i => ({
                  value: i.value,
                  children: i.text
                })) || []),
                opts?.filters?.isObject !== false
                  ? {
                      value: 'isObject',
                      children: t(trans.Feed.AllObjects)
                    }
                  : undefined,
                opts.filters?.hasHighlight !== false
                  ? {
                      value: 'hasHighlight',
                      children: t(trans.Feed.hasLabel)
                    }
                  : undefined
              ]
                .filter(Boolean)
                .map(i => ({
                  type: 'item',
                  key: i.value,
                  text: i.children
                }))
            ]}
          />
        </WithBorder>
      )}
    />
  )
  return {
    state,
    groupState,
    finalResults: state.searchResults || groupState.results || state.filterResults || currItems,
    setState,
    renderSearch,
    renderFilter,
    calculateSearch,
    renderGrouperChooser
  }
}
