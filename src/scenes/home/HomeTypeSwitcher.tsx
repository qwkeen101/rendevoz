import { AnimatePopover, Icon, Menu, WithBorder } from '@/components'
import useHomeConfig from '@/scenes/home/useHomeConfig'
import { orderBy } from 'lodash'
import { memo, useMemo } from 'react'
import { MetaObject } from '~/typings'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'

export default memo(({ objects }: { objects: MetaObject[] }) => {
  const { t } = useTranslation()
  const { allVisibleTypes, allCount, pinned } = useMemo(() => {
    const typeToCount: Record<string, number> = {}
    const tagToCount: Record<number, number> = {}
    objects.forEach(i => {
      typeToCount[i.type] = (typeToCount[i.type] ?? 0) + 1
      i.tags?.forEach(t => {
        tagToCount[t] = (tagToCount[t] ?? 0) + 1
      })
    })
    return {
      allVisibleTypes: typeToCount,
      allCount: objects.length,
      pinned: objects.filter(i => i.pinned).length
    }
  }, [objects])
  const config = useHomeConfig()
  const typeToTranslation = {
    all: t('general.All types'),
    pinned: t(trans.Pinned)
  }
  return (
    <AnimatePopover
      align={'start'}
      padding={6}
      withClickCover
      content={setV => (
        <WithBorder className={'pt-0.5 pb-1'} width={180}>
          <Menu.NavigationMenu
            onSelect={item => {
              setV(false)
              useHomeConfig.update(curr => ({ ...curr, type: item.key, breadcrumbsFutureStack: [] }))
            }}
            layout={[
              {
                type: 'title',
                name: t('general.File type')
              },
              {
                type: 'item',
                key: 'all',
                text: typeToTranslation['all'],
                icon: 'park-all-application',
                suffix: allCount > 0 ? `${allCount}` : undefined
              },
              {
                type: 'item',
                key: 'pinned',
                text: typeToTranslation['pinned'],
                icon: 'park-star',
                suffix: pinned > 0 ? `${pinned}` : undefined
              },
              ...orderBy(Object.keys(allVisibleTypes), type => allVisibleTypes[type], 'desc').map(type => ({
                key: type,
                type: 'item',
                text: Global.utils.getTypeName(type),
                icon: Global.utils.getIcon(type),
                suffix: `${allVisibleTypes[type]}`
              }))
            ]}
          />
        </WithBorder>
      )}
      positions={['bottom']}
    >
      <div className={'text-2xl w-fit flex line-clamp-1 cursor-pointer'}>
        {typeToTranslation[config.type || 'all'] || Global.utils.getTypeName(config.type)}
      </div>
    </AnimatePopover>
  )
})
