import { CollectionStore, MetaStore } from '@/api/stores'
import React, { memo } from 'react'
import { SimpleObject } from '@/core'
import useHomeConfig from '@/scenes/home/useHomeConfig'
import classnames from 'classnames'
import trans from '@/consts/trans'
import { DateFormat } from '@/utils'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components'
import ContextMenu from '@/components/contextMenu'
import { IHomeItem } from '@/scenes/home/useHomeItems'
import folder from '@/assets/images/folder.png'
const GalleryItem = memo(
  ({
    type,
    id,
    onSelect,
    selected,
    contextMenu
  }: {
    type: 'collection' | 'meta'
    id: number
    selected: boolean
    onSelect?: VoidFunction
    contextMenu: IHomeItem['contextMenu']
  }) => {
    if (type === 'meta') {
      const meta = MetaStore.useValue(id)
      if (!meta) return null
      return (
        <div data-id={id} className={'pointer-events-auto'}>
          <SimpleObject
            isSelected={selected}
            onSelect={onSelect}
            withDefaultPadding={false}
            metaObjectId={id}
            mode={'thumbnail'}
            bg={'secondary'}
          />
        </div>
      )
    }
    if (type === 'collection') {
      const { t } = useTranslation()
      const collection = CollectionStore.useValue(id)
      if (!collection) return null
      return (
        <ContextMenu content={setV => contextMenu(setV)}>
          <div
            data-id={id}
            style={{
              aspectRatio: '4 / 3'
            }}
            className={classnames(
              selected && 'select-color-box-shadow select-color-super-transparent-bg',
              'flex pointer-events-auto bg-popover cursor-pointer flex-col rounded-xl overflow-hidden w-full light-hover border transition-colors'
            )}
            onClick={() => {
              if (onSelect) {
                onSelect()
                return
              }
              if (collection) {
                useHomeConfig.update(c => ({
                  ...c,
                  breadcrumbs: [...(c.breadcrumbs || []), collection.id]
                }))
              }
            }}
          >
            <div className={'flex-1 flex items-center justify-center'}>
              <img src={folder} className={'size-14'} />
            </div>
            <div className={classnames('border-top px-3 py-2 shrink-0 gap-2')}>
              <div
                className={classnames('line-clamp-1 break-all', !collection.name ? 'super-transparent-font' : 'primary-font')}
              >
                {collection.name || t(trans.Unnamed)}
              </div>
              <div className={'font-size-12 mt-0.5 transparent-font'}>
                {t('general.Folder')} · {DateFormat.formatDate(collection.createdAt)}
              </div>
            </div>
          </div>
        </ContextMenu>
      )
    }
  }
)

export default GalleryItem
