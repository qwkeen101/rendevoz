import useCollectionStore from '@/stores/collection.store'
import { FC, useState } from 'react'
import { ICollection } from '~/typings/data'
import { IForm } from './types'
import useFlipForm from './useFlipForm'
const CollectionForm: FC<IForm<ICollection>> = ({ onSubmit, onBack, initialObject }) => {
  const [collection, setCollection] = useState<Partial<ICollection>>({
    items: [],
    ...initialObject
  })
  const isEditingExistedCollection = initialObject !== undefined
  const { renderForm } = useFlipForm({
    layout: [
      {
        type: 'nameInput',
        value: collection.name,
        onChange: v => setCollection({ ...collection, name: v })
      },
      {
        type: 'group',
        children: [
          {
            type: 'colorPicker',
            color: collection.color,
            onChange: c => setCollection({ ...collection, color: c })
          },
          {
            type: 'iconPicker',
            icon: collection.icon,
            onChange: i => setCollection({ ...collection, icon: i })
          }
        ]
      }
    ],
    onBack,
    onSubmit: () => onSubmit?.(collection),
    formTitle: isEditingExistedCollection ? 'Update Collection Details' : 'Create New Collection',
    submitText: isEditingExistedCollection ? 'update' : 'create'
  })

  return renderForm()
}

export default CollectionForm
