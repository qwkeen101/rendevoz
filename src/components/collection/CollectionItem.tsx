import useCollectionStore from '@/stores/collection.store'
import { format } from 'date-fns'
import { FC, memo, MouseEventHandler, useEffect, useState } from 'react'
import { ICollection, INote, IPdfDocument } from '~/typings/data'
import { Content } from '../base'
import MenuItem from '../base/menu/MenuItem'
import Icon from '../base/Icon'
import styles from './index.module.less'
import { isDocument, isNote } from './utils'
import { useTranslation } from 'react-i18next'

interface CollectionItemProps {
  collection: ICollection
  selected?: boolean
  onClick?: MouseEventHandler
  onDoubleClick?: MouseEventHandler
  onContextMenu?: MouseEventHandler
}

const CollectionItem: FC<CollectionItemProps> = ({ collection, selected, onClick, onDoubleClick, onContextMenu }) => {
  const { t } = useTranslation()
  const { getChildrenCollections, getChildrenDocuments, getChildrenItems } = useCollectionStore()
  const childrenCollections = getChildrenCollections(collection.id)
  const [childrenItems, setChildrenItems] = useState([])
  const childrenNotes = childrenItems.filter(i => isNote(i)) as INote[]
  const childrenDocuments = childrenItems.filter(i => isDocument(i)) as IPdfDocument[]
  useEffect(() => {
    getChildrenItems(collection.id).then(items => {
      setChildrenItems(items.filter(i => !!i && !i.deleted))
    })
  }, [collection.id, getChildrenItems])
  return (
    <MenuItem
      id={collection.id}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      icon={<Icon name="park-folder-close" />}
      selected={selected}
      type="button"
    >
      <Content flex column>
        <span className={styles.collectionItemName}>{collection.name}</span>
        <Content flex gap={10} className={styles.collectionItemDetails}>
          <span>
            {childrenCollections?.length} {t('collection.collections')}
          </span>
          <span>
            {childrenDocuments?.length} {t('collection.files')}
          </span>
          <span>
            {childrenNotes.length} {t('collection.notes')}
          </span>
          <span>
            {t('collection.last update at')} {format(collection.updatedAt, 'd MMM y')}
          </span>
        </Content>
      </Content>
    </MenuItem>
  )
}
export default memo(CollectionItem)
