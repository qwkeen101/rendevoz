import { ICollection } from '~/typings'
import { CollectionStore } from '@/api/stores'
import { memo, useMemo } from 'react'
import { FormFooter, Icon } from '@/components'
import { useTranslation } from 'react-i18next'
import { Icons } from '@/consts'
import trans from '@/consts/trans'
import EmptyList from '@/core/components/common/EmptyList'
import { atom } from 'jotai/index'
import { useAtom } from 'jotai'

export const CollectionMoveToAtom = atom<{
  breadcrumbs: number[]
}>({
  breadcrumbs: []
})
export default memo(
  ({ onChange, onClose, enableRoot = false }: { onChange: (id: number) => void; onClose: VoidFunction; enableRoot?: boolean }) => {
    const [{ breadcrumbs }, setCache] = useAtom(CollectionMoveToAtom)
    const allCollections = CollectionStore.useAll()
    const { t } = useTranslation()
    const visibleCollections = useMemo(() => {
      if (breadcrumbs.length === 0) {
        return allCollections.filter(i => i.parentId === 0).toSorted((b, a) => a.createdAt - b.createdAt)
      } else {
        return (CollectionStore.getCachedCollectionById(breadcrumbs[breadcrumbs.length - 1])
          ?.items?.filter(i => i.type === 'collection')
          .map(i => CollectionStore.getCachedCollectionById(i.id))
          .filter(i => i && CollectionStore.isVisibleCollection(i)) || []) as ICollection[]
      }
    }, [allCollections, breadcrumbs])
    const showEmpty = breadcrumbs.length === 0 && !visibleCollections.length
    const showMove = breadcrumbs.length > 0 && visibleCollections.length === 0
    return (
      <div className={'flex flex-col select-none'} style={{ width: 'min(600px, 90vw)', maxHeight: 'min(85vh, 900px)', minHeight: 360 }}>
        <div className={'flex font-size-13 transparent-font items-center w-full bg-third py-2 px-4'}>
          {breadcrumbs.length === 0 ? (
            '全部文件'
          ) : (
            <div className={'flex gap-1 items-center'}>
              <div
                className={'hover:underline whitespace-nowrap cursor-pointer'}
                onClick={() => {
                  setCache(s => ({ ...s, breadcrumbs: s.breadcrumbs.slice(0, -1) }))
                }}
              >
                返回
              </div>
              <div className={'border-right h-5 mx-2'}></div>
              {[
                { name: '全部文件', id: 'home' },
                ...breadcrumbs.map(i => ({ id: i, name: CollectionStore.getCachedCollectionById(i)?.name }))
              ].map((i, idx, arr) => (
                <div key={i.id} className={'flex gap-1 items-center'}>
                  <div
                    onClick={() => {
                      if (i.id === 'home') {
                        setCache(s => ({ ...s, breadcrumbs: [] }))
                      } else {
                        const idx = breadcrumbs.findIndex(o => o === i.id)
                        setCache(s => ({ ...s, breadcrumbs: breadcrumbs.slice(0, idx + 1) }))
                      }
                    }}
                    className={'hover:underline line-clamp-1 break-all cursor-pointer'}
                  >
                    {i.name || t(trans.Unnamed)}
                  </div>
                  {idx !== arr.length - 1 && <div>/</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        {showMove ? (
          <div className={'flex gap-3 justify-center transparent-font items-center w-full flex-1'}>
            {t('general.Move to')} {CollectionStore.getCachedCollectionById(breadcrumbs[breadcrumbs.length - 1])?.name || t(trans.Unnamed)}
          </div>
        ) : showEmpty ? (
          <EmptyList className={'flex-1'} />
        ) : (
          <div className={'overflow-y-auto flex-1 p-2'}>
            {visibleCollections.map(i => (
              <div
                className={'button flex items-center gap-3 !p-2'}
                key={i.id}
                onClick={() => setCache(s => ({ ...s, breadcrumbs: [...s.breadcrumbs, i.id] }))}
              >
                <Icon name={Icons.Folder} size={18} />
                <div className={!i.name ? 'super-transparent-font' : ''}>{i.name || t(trans.Unnamed)}</div>
              </div>
            ))}
          </div>
        )}
        <FormFooter
          className={'p-4 border-top'}
          onCancel={onClose}
          canConfirm={enableRoot ? true : breadcrumbs.length > 0}
          onConfirm={() => {
            if (breadcrumbs.length > 0) {
              const last = breadcrumbs[breadcrumbs.length - 1]
              onChange(last)
            } else if (enableRoot) {
              onChange(0)
            }
          }}
          left={
            <div
              onClick={() => CollectionStore.create(breadcrumbs[breadcrumbs.length - 1] || 0)}
              className={'flex font-medium hover-primary-color transition-colors items-center gap-2 transparent-font cursor-pointer'}
            >
              {t('sidebar.Create new folder')}
            </div>
          }
        />
      </div>
    )
  }
)
