import { Button, Icon } from '@/components'
import { memo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import TabTitle from '@/components/layout/TabTitle'
import HomeGallery from '@/scenes/home/HomeGallery'
import useHomeConfig from '@/scenes/home/useHomeConfig'
import HomeList from '@/scenes/home/HomeList'
import useHomepageEdit from '@/scenes/home/useHomepageEdit'
import produce from 'immer'
import useHomeItems from '@/scenes/home/useHomeItems'
import HomeBreadcrumbs from '@/scenes/home/HomeBreadcrumbs'
import HomeHeader from '@/scenes/home/HomeHeader'
import { CollectionStore } from '@/api/stores'

export type IHomeSearchResults = {
  metas: number[]
  collections: number[]
}

export default memo(() => {
  const { t } = useTranslation()
  const homeConfig = useHomeConfig()
  const homeMode = homeConfig.mode
  const containerRef = useRef<HTMLDivElement>(null)
  const { renderSearch, items, objects } = useHomeItems()
  const { renderSelectBox, isEditing, renderToolbar, selected, setSelected } = useHomepageEdit({
    scrollElementRef: containerRef,
    items
  })
  useEffect(() => {
    // deepsearch('中国房地产', {})
  }, [true])
  return (
    <div ref={containerRef} className={'p-10 pl-8 w-full h-full relative flex flex-col overflow-y-auto'}>
      {renderSelectBox()}
      {renderToolbar()}
      <TabTitle title={t('general.home')} icon="park-home" />
      <div
        style={{
          marginBottom: '1.5rem',
          height: '3.5rem'
        }}
        className={'flex items-start shrink-0 pl-2 justify-between'}
      >
        <HomeBreadcrumbs objects={objects} />
        <div className={'flex items-center gap-4'}>
          {renderSearch()}
          <Button.IconButton
            text={t('general.New folder')}
            icon={'park-folder-plus'}
            onClick={() => {
              const breadcrumbs = useHomeConfig.getValue().breadcrumbs
              CollectionStore.create(breadcrumbs?.length ? breadcrumbs[breadcrumbs.length - 1] : undefined)
            }}
            className={'select-color-border hover-bg-super-transparent-select-color select-color-font !h-9 !pr-4 !rounded-lg !pl-3'}
          ></Button.IconButton>
          <Button.IconButton
            text={t('general.New')}
            icon={'park-plus'}
            strokeWidth={4}
            onClick={() => {
              const id = homeConfig.breadcrumbs?.slice().pop()
              Global.metaOps.createObjects?.(undefined, undefined, {
                parentCollectionId: id,
                openAfterTriggerOnce: id ? false : true
              })
            }}
            className={'select-button !h-9 !pr-4 !rounded-lg !pl-3'}
          ></Button.IconButton>
        </div>
      </div>
      <HomeHeader />
      {homeMode === 'gallery' && (
        <HomeGallery
          selected={selected}
          onSelect={id => {
            setSelected(s =>
              produce(s, draft => {
                draft.has(id) ? draft.delete(id) : draft.add(id)
              })
            )
          }}
          isEditing={isEditing}
          items={items}
          scrollElementRef={containerRef}
        />
      )}
      {homeMode === 'list' && (
        <HomeList
          selected={selected}
          onSelect={id => {
            setSelected(s =>
              produce(s, draft => {
                draft.has(id) ? draft.delete(id) : draft.add(id)
              })
            )
          }}
          isEditing={isEditing}
          items={items}
          scrollElementRef={containerRef}
        />
      )}
    </div>
  )
})
