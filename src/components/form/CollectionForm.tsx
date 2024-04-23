import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ICollection } from '~/typings/data'
import { IForm } from './types'
import useFlipForm from './useFlipForm'

const CollectionForm: FC<IForm<ICollection>> = ({ onSubmit, onBack, initialObject }) => {
  const [collection, setCollection] = useState<Partial<ICollection>>({
    items: [],
    ...initialObject
  })
  const isEditingExistedCollection = initialObject !== undefined
  const { t } = useTranslation()
  const { renderForm } = useFlipForm({
    layout: [
      {
        type: 'nameInput',
        value: collection.name,
        autoFocus: true,
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
    formTitle: isEditingExistedCollection
      ? t('form.update item details', { item: t('general.collection') })
      : t('form.create new item', { item: t('general.collection') }),
    submitText: isEditingExistedCollection ? 'update' : 'create'
  })

  return renderForm()
}

export default CollectionForm
