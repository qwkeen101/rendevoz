import { Noop } from '@/common/types'
import useCollectionStore from '@/stores/collection.store'
import { FC, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ICollection } from '~/typings/data'
import { Form } from '../base'

interface NewCollectionFormProps {
  parentCollection?: ICollection | null
  onAddCollection?: (collection: ICollection) => void
  onBack?: Noop
}
const NewCollectionForm: FC<NewCollectionFormProps> = ({ parentCollection, onAddCollection, onBack }) => {
  const collection = useRef<ICollection>({ parentId: parentCollection?.id })
  collection.current.parentId = parentCollection?.id
  const { addCollection, addItemToCollection } = useCollectionStore()
  const { t } = useTranslation()
  useEffect(() => {
    collection.current.parentId = parentCollection?.id
  })
  return (
    <Form
      submitText="create"
      backText="cancel"
      style={{ height: '100%' }}
      title={t('form.create collection')}
      onSubmit={() => {
        const c = addCollection(collection.current)
        if (parentCollection) {
          setTimeout(() => {
            addItemToCollection(
              {
                type: 'collection',
                id: c.id
              },
              parentCollection.id
            )
          }, 200)
        }
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
    </Form>
  )
}

export default NewCollectionForm
