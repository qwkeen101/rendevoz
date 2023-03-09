import Id from '@/utils/id'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MetaObject } from '~/typings/data'
import { GlobalGraphInstance } from '../graph/GlobalGraph'
import { IForm } from './types'
import useFlipForm from './useFlipForm'

const ObjectForm: FC<
  IForm<MetaObject> & {
    shouldPreviewGraph?: boolean
  }
> = ({ onBack, onSubmit, initialObject, shouldPreviewGraph }) => {
  const [object, setObject] = useState({ id: Id.getId(), ...initialObject })
  const { t } = useTranslation()
  const { renderForm } = useFlipForm({
    layout: [
      {
        type: 'nameInput',
        value: object.name,
        onChange: v => setObject({ ...object, name: v })
      },
      {
        type: 'descriptionInput',
        value: object.description,
        onChange: v => setObject({ ...object, description: v })
      },
      {
        type: 'tagDisplayer',
        tags: object.tags
      },
      {
        type: 'group',
        children: [
          shouldPreviewGraph
            ? {
                type: 'previewGraph',
                onClick: () => GlobalGraphInstance?.open(object)
              }
            : undefined,
          {
            type: 'imagePicker',
            imageUrl: object.coverImgSrc,
            onChange: v => setObject({ ...object, coverImgSrc: v })
          },
          {
            type: 'tagPicker',
            tags: object.tags,
            onChange: v => setObject({ ...object, tags: v })
          }
        ]
      }
    ],
    onBack,
    onSubmit: () => onSubmit?.(object),
    formTitle: initialObject
      ? t('form.update item details', { item: t('general.object') })
      : t('form.create new item', { item: t('general.object') }),
    submitText: initialObject ? 'update' : 'create'
  })
  return renderForm()
}

export default ObjectForm
