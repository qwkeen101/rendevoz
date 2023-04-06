import Id from '@/utils/id'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MetaObject } from '~/typings'
import { GlobalGraphInstance, TypeToTypeName } from '@/core'
import { IForm } from './types'
import useFlipForm from './useFlipForm'
import { ObjectStore } from '@/stores'
import { ObjectFamily } from '@/stores/object.store'
import { useGlobalAtomValue } from '@/hooks'

const ObjectForm: FC<
  IForm<MetaObject> & {
    shouldPreviewGraph?: boolean
  }
> = ({ onBack, onSubmit, initialObject, shouldPreviewGraph }) => {
  const [object, setObject] = useState({ id: Id.getId(), ...initialObject })
  const { t } = useTranslation()
  const objectAtom =
    initialObject?.type && initialObject.objectId && ['webpage', 'audio', 'video'].includes(initialObject.type)
      ? ObjectStore(initialObject.type as keyof ObjectFamily).createAtom(initialObject.objectId)
      : undefined
  const targetObject = objectAtom && useGlobalAtomValue(objectAtom)

  const { renderForm } = useFlipForm({
    layout: [
      initialObject?.type
        ? {
            type: 'custom',
            children: (
              <div
                style={{
                  fontWeight: 600
                }}
              >
                {t('general.type')}: {t(`general.${TypeToTypeName[initialObject.type]}`)}
              </div>
            )
          }
        : undefined,
      targetObject && 'url' in targetObject
        ? {
            type: 'input',
            text: t('general.url'),
            value: targetObject.url,
            onChange: v => ObjectStore(targetObject.specType).updateOne({ id: targetObject.id, url: v }, { silent: true })
          }
        : undefined,
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
                onClick: () => GlobalGraphInstance?.open?.(object)
              }
            : undefined,
          {
            type: 'imagePicker',
            imageUrl: object.coverImgSrc,
            onChange: v => setObject({ ...object, coverImgSrc: v })
          },
          {
            type: 'colorPicker',
            color: object.color,
            onChange: c => setObject({ ...object, color: c })
          },
          {
            type: 'iconPicker',
            icon: object.icon,
            onChange: i => setObject({ ...object, icon: i })
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
    formTitle: initialObject?.id
      ? t('form.update item details', { item: t('general.object') })
      : t('form.create new item', { item: t('general.object') }),
    submitText: initialObject?.id ? 'update' : 'create'
  })
  return renderForm()
}

export default ObjectForm
