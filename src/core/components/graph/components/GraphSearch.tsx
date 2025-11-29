import { memo, useMemo, useState } from 'react'
import { BetterInput, IconWithPopover, VirtualList, WithBorder } from '@/components'
import { Icons } from '@/consts'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { useAtom } from 'jotai'
import useGraphFilter from '@/core/components/graph/hooks/useGraphFilter'
import { useDebounceEffect, useDebounceFn } from '@/hooks'
import UseGraphNodes from '@/core/components/graph/hooks/useGraphNodes'
import { MetaStore } from '@/api/stores'
import { SimpleObject } from '@/core'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'

export default memo(() => {
  const [nodes] = UseGraphNodes()
  const types = useMemo(
    () => MetaStore.getVisibleMetaTypes(nodes.map(i => MetaStore.getCachedMetaObject(i.id)).filter(i => i)),
    [nodes.length]
  )
  const [state, setState] = useAtom(useGraphFilter.atom)
  const [afterFilter, setAfterFilter] = useState<number[]>([])
  const { t } = useTranslation()
  useDebounceEffect(
    () => {
      setAfterFilter(nodes.filter(i => i.opacity === undefined || i.opacity === 1).map(i => i.id))
    },
    [nodes],
    { wait: 200 }
  )
  const debounceChangeSearch = useDebounceFn(
    (v: string) => {
      setState(s => ({ ...s, search: v }))
    },
    { wait: 300 }
  )
  return (
    <div className={'flex flex-col h-full w-full'}>
      <div className={'pt-4 px-4 pb-1'}>
        <div className={'flex py-1.5 px-3 items-center border-box-shadow rounded-lg focus-within-input'}>
          <BetterInput
            defaultValue={state.search}
            className={'grow'}
            placeholder={t('general.Type to search')}
            onChange={v => {
              debounceChangeSearch.run(v.target.value)
            }}
          />
          <IconWithPopover
            name={Icons.Filter}
            placement={['bottom']}
            align={'end'}
            theme={state.filterRules?.rules.length ? 'filled' : undefined}
            className={state.filterRules?.rules.length ? 'select-color-font' : undefined}
            content={
              <WithBorder>
                <BetterFilter
                  visibleTypes={types}
                  root={state.filterRules}
                  onChange={v => {
                    setState(s => ({ ...s, filterRules: v }))
                  }}
                />
              </WithBorder>
            }
          />
        </div>
        <div className={'menu-sub-title mt-3'}>
          {t('graph.Node count')}({afterFilter.length})
        </div>
      </div>
      <VirtualList
        estimateSize={30}
        className={'w-full h-0 px-3 flex-1'}
        paddingEnd={100}
        items={afterFilter}
        renderItem={i => <SimpleObject mode={'title'} metaObjectId={i as number} />}
      />
    </div>
  )
})
