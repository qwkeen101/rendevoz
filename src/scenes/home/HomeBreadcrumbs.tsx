import { Icon, Menu, Select, WithBorder } from '@/components'
import { ICollection, MetaObject } from '~/typings'
import useHomeConfig from '@/scenes/home/useHomeConfig'
import classnames from 'classnames'
import { CollectionStore } from '@/api/stores'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import HomeTypeSwitcher from '@/scenes/home/HomeTypeSwitcher'
import HomeWorkspaceSwitcher from '@/scenes/home/HomeWorkspaceSwitcher'

export type IHomeBreadcrumbs = {
  name: string
  id: number
  items: Required<ICollection>['items']
}[]

export default ({ className, objects }: { className?: string; objects: MetaObject[] }) => {
  const config = useHomeConfig()
  const breadcrumbs = useMemo(() => config.breadcrumbs || [], [config.breadcrumbs])
  const { t } = useTranslation()
  const currentName = breadcrumbs.length ? CollectionStore.getCachedCollectionById(breadcrumbs[breadcrumbs.length - 1])?.name : '全部文件'
  return (
    <div className={classnames('flex font-medium gap-1 items-center', className)}>
      {!breadcrumbs.length ? (
        <>
          <div>
            <HomeWorkspaceSwitcher />
            <HomeTypeSwitcher objects={objects} />
          </div>
        </>
      ) : (
        <>
          <Icon
            onClick={() => {
              if (breadcrumbs?.length) {
                useHomeConfig.update(c => ({
                  ...c,
                  breadcrumbs: c.breadcrumbs?.slice(0, -1),
                  breadcrumbsFutureStack: [...(c.breadcrumbsFutureStack || []), breadcrumbs[breadcrumbs.length - 1]]
                }))
              }
            }}
            strokeWidth={4}
            size={18}
            className={'square-button mr-2 -ml-2'}
            name={'park-left'}
          />
          <div className={classnames(!currentName ? 'super-transparent-font' : '', 'font-medium text-xl')}>
            {currentName || t(trans.Unnamed)}
          </div>
        </>
      )}
    </div>
  )
}
