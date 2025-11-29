import { atom, useAtom } from 'jotai'
import { ObjectStore } from '@/api/stores'
import { Button, Icon, IconWithPopover, Menu, Select, WithBorder } from '@/components'
import { orderBy } from 'lodash'
import { useMemoizedFn } from '@/hooks'
import { useLayoutEffect } from 'react'
import { getMetaObjectByURL } from '@/api/indexData/urlToId'
import calculateAppearIn from '@/core/search/calculateAppearIn'
import { IBase, MetaObject } from '~/typings'
import CalculateTags from '@/core/object/objectList/calculateTags'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { Icons } from '@/consts'
import useUpdateIsomorphicLayoutEffect from '@/hooks/utils/useUpdateIsomorphicLayoutEffect'
import { NoResult } from '@/core/components'
import classnames from 'classnames'

type GrouperOption = {
  id: number
  name: string
  icon?: string
  image?: string
  count: number
  items: number[]
}
const CacheAtom = atom<
  Record<
    string,
    {
      grouper?: 'appearsIn' | 'tag' | string
      results?: number[]
      selectedOption?: number
      grouperOptions?: GrouperOption[]
    }
  >
>({})

export default function <T extends IBase>(
  cacheKey: string,
  opts: {
    items?: number[]
    groupers: {
      value: string
      text: string
    }[]
    itemType: string
    getURL: (item: T) => string
    getCustomGrouper?: (value: string, items: T[]) => Promise<GrouperOption[]>
  }
) {
  const { t } = useTranslation()
  const { itemType, getCustomGrouper, items } = opts
  const [state, setState] = useAtom(CacheAtom)
  const currentCache = state[cacheKey] ?? {
    grouper: undefined
  }
  useLayoutEffect(() => {
    calculateCache()
  }, [opts?.items])
  useUpdateIsomorphicLayoutEffect(() => {
    calculateCache()
  }, [currentCache.grouper])
  const calculateCache = useMemoizedFn(async () => {
    if (!currentCache.grouper) {
      setState(s => ({
        ...s,
        [cacheKey]: {
          grouper: undefined,
          results: undefined,
          grouperOptions: undefined
        }
      }))
      return
    }
    const fetched = (items ? await ObjectStore(itemType).getMultipleByIds(items) : await ObjectStore(itemType).fetchAll()) as T[]
    switch (currentCache.grouper) {
      case 'tag': {
        const allMetaOnes = fetched
          .map(i => {
            const meta = getMetaObjectByURL(opts.getURL(i))
            if (meta && !meta.temp && !meta.deleted) {
              return {
                one: i,
                meta
              }
            }
            return undefined
          })
          .filter(i => i) as {
          one: T
          meta: MetaObject
        }[]
        const res = await CalculateTags(allMetaOnes.map(i => i.meta.id))
        const metaIdToItemId = new Map(allMetaOnes.map(i => [i.meta.id, i.one.id]))
        const options: (typeof currentCache)['grouperOptions'] = []
        Array.from(res.entries()).forEach(([tag, v]) => {
          options.push({
            id: tag.id,
            count: v.length,
            items: v.map(o => metaIdToItemId.get(o)!),
            name: tag.name || 'Unnamed tag'
          })
        })

        const sorted = orderBy(options, i => i.count, 'desc')
        const selected = sorted.some(i => i.id === currentCache.selectedOption) ? currentCache.selectedOption : sorted[0]?.id
        const results = sorted.find(i => i.id === selected)?.items
        setState(s => ({
          ...s,
          [cacheKey]: {
            ...s[cacheKey],
            grouper: 'tag',
            selectedOption: selected,
            results,
            grouperOptions: sorted
          }
        }))
        break
      }
      default: {
        const options = await getCustomGrouper?.(currentCache.grouper, fetched)
        if (options) {
          const selected = options.some(i => i.id === currentCache.selectedOption) ? currentCache.selectedOption : options[0]?.id
          const results = options.find(i => i.id === selected)?.items
          setState(s => ({
            ...s,
            [cacheKey]: {
              ...s[cacheKey],
              selectedOption: selected,
              results,
              grouperOptions: options
            }
          }))
        }
      }
    }
  })
  const renderGrouperChooser = () => {
    return (
      <>
        <IconWithPopover
          name={Icons.ApplicationAll}
          placement={['bottom', 'top']}
          size={16}
          className={'transparent-font hover-primary-color transition-colors'}
          content={setV => (
            <WithBorder
              className={classnames('popover-menu-mid', currentCache.grouper && 'w-64 min-h-52 max-h-80 overflow-y-auto flex flex-col')}
            >
              {currentCache.grouper && (
                <div className={'flex font-medium items-start pl-3 pt-1 pb-2 pr-2 font-size-13 justify-between'}>
                  {opts.groupers.find(i => i.value === currentCache.grouper)?.text}
                  <Icon
                    size={13}
                    name={Icons.Close}
                    className={'hover-active-button pt-0.5'}
                    strokeWidth={6}
                    onClick={() => {
                      setState(s => ({ ...s, [cacheKey]: { ...s[cacheKey], grouper: undefined } }))
                    }}
                  />
                </div>
              )}
              {currentCache.grouper && !currentCache.grouperOptions?.length ? <NoResult className={'font-size-13'} /> : null}
              <Menu.NavigationMenu
                onSelect={item => {
                  const key = item.key
                  if (key.startsWith('option_')) {
                    const option = Number(key.replace('option_', ''))
                    const items = currentCache.grouperOptions?.find(i => i.id === option)?.items
                    if (items) {
                      setState(s => ({ ...s, [cacheKey]: { ...s[cacheKey], results: items, selectedOption: option } }))
                    }
                  } else {
                    setState(s => ({ ...s, [cacheKey]: { ...s[cacheKey], grouper: item.key === 'none' ? undefined : item.key } }))
                  }
                }}
                defaultSelected={currentCache.grouper ? [`option_${currentCache.selectedOption}`] : [currentCache.grouper ?? 'none']}
                layout={
                  currentCache.grouper
                    ? (currentCache.grouperOptions || []).map(i => ({
                        type: 'item',
                        key: `option_${i.id}`,
                        text: i.name,
                        icon: i.icon,
                        image: i.image,
                        suffix: `${i.count}`
                      }))
                    : [
                        {
                          type: 'title',
                          name: t('general.Grouper')
                        },
                        ...(opts?.groupers || []).map(i => ({ key: i.value, text: i.text, type: 'item' }))
                      ]
                }
              />
            </WithBorder>
          )}
        />
      </>
    )
  }

  return {
    renderGrouperChooser,
    state: currentCache
  }
}
