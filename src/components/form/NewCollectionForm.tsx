import { Noop } from '@/common/types'
import { useTheme } from '@/hooks'
import useCollectionStore from '@/stores/collection.store'
import { css } from '@emotion/css'
import { FC, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ICollection } from '~/typings/data'
import { Form } from '../base'
import CollectionItem from '../collection/CollectionItem'

interface NewCollectionFormProps {
  parentCollection?: ICollection | null
  onAddCollection?: (collection: ICollection) => void
  onBack?: Noop
}
const NewCollectionForm: FC<NewCollectionFormProps> = ({ parentCollection, onAddCollection, onBack }) => {
  const collection = useRef<ICollection>({ parentId: parentCollection?.id })
  collection.current.parentId = parentCollection?.id
  const { addCollection } = useCollectionStore()
  const { t } = useTranslation()
  const { primaryColor } = useTheme('primaryColor')
  return (
    <Form
      style={{ height: '100%' }}
      title={t('form.create collection')}
      onSubmit={() => {
        const c = addCollection(collection.current)
        onAddCollection?.(c)
      }}
      onBack={onBack}
    >
      <Form.Item
        required
        requireMessage={t('form.please input collection name')}
        type="input"
        text={t('form.name')}
        onChange={value => (collection.current.name = value)}
      ></Form.Item>
      <Form.Item type="component">
        <span
          className={css({
            fontSize: 14,
            fontWeight: 600,
            color: primaryColor
          })}
        >
          {t('form.under')} {parentCollection ? <CollectionItem collection={parentCollection} /> : t('collection.root')}
        </span>
      </Form.Item>
    </Form>
  )
}

export default NewCollectionForm
