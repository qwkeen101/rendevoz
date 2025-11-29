import { ReactElement, useLayoutEffect, useMemo, useState } from 'react'
import HomeSearch from '@/scenes/home/HomeSearch'
import useHomeConfig from '@/scenes/home/useHomeConfig'
import { ICollection, MetaObject } from '~/typings'
import { CollectionStore, MetaStore } from '@/api/stores'
import useCollectionMetaTreeView, { ITreeView } from '@/core/components/common/useCollectionMetaTreeView'
import { IconWithPopover, WithBorder } from '@/components'
import { ObjectActionMenu } from '@/core'
import CollectionMenu from '@/core/components/collection/CollectionMenu'
import { Icons } from '@/consts'
import BetterFilter from '@/core/object/filter/BetterFilter'
import classnames from 'classnames'
import folder from '@/assets/images/folder.png'
export type IHomeItem = {
  name: string
  onClick: VoidFunction
  image?: string
  icon?: string
  createdAt: number
  pinned: boolean
  type: 'collection' | 'meta'
  viewAt?: number
  id: number
  contextMenu: (setV: (v: boolean) => void) => ReactElement
}
export type IHomeSearchResults = {
  metas: number[]
  collections: number[]
}

export const normalizeAsHomeItem = (original: ICollection | MetaObject, type: 'meta' | 'collection'): IHomeItem => {
  const breadcrumbs = useHomeConfig.getValue().breadcrumbs
  const currentCollection = breadcrumbs ? breadcrumbs[breadcrumbs.length - 1] : undefined
  if (type === 'meta') {
    const c = original as MetaObject
    return {
      pinned: !!c.pinned,
      type: 'meta',
      name: Global.metaOps.getMetaName(c),
      icon: Global.utils.getIcon(c.type),
      image: c.coverImgSrc,
      id: c.id,
      onClick: () => {
        Global.layoutOps?.openObject(c.id)
      },
      createdAt: c.createdAt,
      viewAt: c.viewAt,
      contextMenu: setV => (
        <WithBorder>
          <ObjectActionMenu parentCollectionId={currentCollection} onClose={() => setV(false)} metaObjectId={c.id} />
        </WithBorder>
      )
    }
  } else {
    const c = original as ICollection
    return {
      name: c.name || '',
      image: folder,
      id: c.id,
      pinned: !!c.pinned,
      type: 'collection',
      onClick: () => {
        useHomeConfig.update(s => ({
          ...s,
          breadcrumbs: [...(s.breadcrumbs || []), c.id],
          breadcrumbsFutureStack: []
        }))
      },
      createdAt: c.createdAt,
      contextMenu: setV => (
        <WithBorder className={'py-1'} width={200}>
          <CollectionMenu id={c.id} onClose={() => setV(false)} />
        </WithBorder>
      )
    }
  }
}

export default () => {
  const [afterSearch, setAfterSearch] = useState<IHomeSearchResults>()
  const { breadcrumbs, showHidden = false, filter, type } = useHomeConfig()
  const allMetas = MetaStore.useAll({ showHidden: true })
  const allCollections = CollectionStore.useAll()
  const [afterFilter, setAfterFilter] = useState<number[]>()
  useLayoutEffect(() => {
    if (filter?.rules.length) {
      Global.metaOps.filter(filter, undefined, { showHidden: true }).then(res => {
        setAfterFilter(res.map(i => i.id))
      })
    } else {
      setAfterFilter(undefined)
    }
  }, [filter, allMetas])
  const allMetaIds = useMemo(() => allMetas.map(i => i.id), [allMetas])
  const renderSearch = () => {
    return <HomeSearch onResultsChange={res => setAfterSearch(res)} />
  }
  const renderFilter = () => {
    return (
      <IconWithPopover
        className={classnames('square-button !h-8', filter?.rules.length ? 'active-button' : '')}
        placement={['bottom']}
        content={
          <WithBorder>
            <BetterFilter
              root={filter}
              currentMetas={allMetaIds}
              showHiddenMetas={showHidden}
              changeOnUnmount
              onChange={r => {
                useHomeConfig.update(c => ({ ...c, filter: r }))
              }}
            />
          </WithBorder>
        }
        name={Icons.Filter}
      ></IconWithPopover>
    )
  }
  const { view } = useCollectionMetaTreeView({
    id: useMemo(() => allMetas.map(i => i.id), [allMetas]),
    showHidden,
    nestedView: true
  })

  const { collections, objects } = useMemo(() => {
    const transformView = (view: ITreeView[]) => {
      const afterSearchCollectionId = new Set(afterSearch?.collections)
      const afterSearchObjectId = new Set(afterSearch?.metas)
      const afterFilterObjectId = new Set(afterFilter)
      const isMetaVisible = (i: MetaObject) => {
        let visible = true
        if (afterSearch) {
          if (!afterSearchObjectId.has(i.id)) {
            visible = false
          }
        }
        if (afterFilter) {
          if (!afterFilterObjectId.has(i.id)) {
            visible = false
          }
        }
        if (i.hidden) {
          if (!showHidden) {
            visible = false
          }
        }
        return visible
      }
      // 如果没有选择文件夹，则在主页显示搜索/筛选以后在文件夹里的实体
      if (!breadcrumbs?.length) {
        if (afterFilter) {
          return {
            collections: [],
            objects: allMetas.filter(i => isMetaVisible(i))
          }
        }
        if (afterSearch) {
          return {
            collections: afterSearch.collections.map(c => CollectionStore.getCachedCollectionById(c)).filter(Boolean) as ICollection[],
            objects: allMetas.filter(i => isMetaVisible(i)) as MetaObject[]
          }
        }
      }
      return {
        collections: afterFilter
          ? []
          : (view
              .filter(i => (i.type === 'collection' && afterSearch ? afterSearchCollectionId.has(i.id) : true))
              .map(i => CollectionStore.getCachedCollectionById(i.id))
              .filter(Boolean) as ICollection[]),
        objects: view
          .filter(i => i.type === 'meta')
          .map(i => MetaStore.getCachedMetaObject(i.id))
          .filter(i => i && isMetaVisible(i)) as MetaObject[]
      }
    }
    if (breadcrumbs?.length) {
      const last = breadcrumbs[breadcrumbs.length - 1]
      let colView: ITreeView[] | undefined = undefined
      const findColView = (view: ITreeView[]) => {
        view.forEach(v => {
          if (v.id === last) {
            colView = v.children
          } else {
            findColView(v.children)
          }
        })
      }
      findColView(view)
      if (colView) {
        return transformView(colView)
      }
      return {
        collections: [],
        objects: []
      }
    }
    return transformView(view)
  }, [view, afterSearch, breadcrumbs, afterFilter])
  const allVisibleCollections = useMemo(
    () =>
      (afterSearch?.collections.map(i => CollectionStore.getCachedCollectionById(i)) || allCollections).filter(Boolean) as ICollection[],
    [allCollections, afterSearch]
  )
  const allObjects = useMemo(
    () =>
      (afterSearch?.metas.map(i => MetaStore.getCachedMetaObject(i)) || allMetas).filter(i =>
        MetaStore.isVisibleMetaObject(i, {
          showHidden: showHidden
        })
      ),
    [afterSearch, allMetas, showHidden]
  )
  const items = useMemo(() => {
    let res: IHomeItem[] = []
    collections.forEach(c => {
      if (!c) return
      res.push(normalizeAsHomeItem(c, 'collection'))
    })
    objects.forEach(c => {
      res.push(normalizeAsHomeItem(c, 'meta'))
    })
    if (!breadcrumbs?.length && type) {
      switch (type) {
        case 'all':
          break
        case 'pinned':
          res = allObjects.filter(i => i.pinned).map(i => normalizeAsHomeItem(i, 'meta'))
          break
        default: {
          res = allObjects.filter(i => i.type === type).map(i => normalizeAsHomeItem(i, 'meta'))
        }
      }
    }
    return res
  }, [allObjects, allVisibleCollections, type, objects, collections])
  return {
    renderSearch,
    items,
    renderFilter,
    objects: allObjects,
    collections: allVisibleCollections,
    mainPageCollections: collections,
    afterSearch
  }
}
