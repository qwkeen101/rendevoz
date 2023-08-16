import Id from '@/utils/id'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ILocalFile, IVideo, MetaObject } from 'rendevoz'
import { GlobalGraphInstance, TypeToTypeName } from '@/core'
import { IForm } from './types'
import useFlipForm from './useFlipForm'
import { MetaStore, ObjectStore } from '@/stores'
import { ObjectFamily } from '@/stores/object.store'
import { useGlobalAtomValue } from '@/hooks'
import OcrService from '@/services/ocr.service'
import ClassName from '@/styles/classNames'
import { Button } from '../base'
import { transformTextContentToNameAndDescription } from '@/core/global/globalDragOverlay/utils'
import { toast } from 'react-hot-toast'
import { getFilenameWithoutExtension, saveFileLocally } from '@/utils/file'
import { generateVideoThumbnail } from '@/core/video/utils'
import { saveImageLocally } from '@/utils/img'
import FormNoteImporter from './FormNoteImporter'
import { TypeToRegisteredMetaObject } from '@/stores/meta.store'
import { fetchHead } from '@/core/global/globalDragOverlay/useDropObject'

const ObjectForm: FC<
  IForm<MetaObject> & {
    shouldPreviewGraph?: boolean
  }
> = ({ onBack, onSubmit, initialObject, shouldPreviewGraph }) => {
  const [object, setObject] = useState({ id: Id.getId(), ...initialObject })
  const { t } = useTranslation()
  const [ocrLoading, toggleOcrLoading] = useState(false)
  const objectAtom =
    initialObject?.type && initialObject.objectId
      ? ObjectStore(initialObject.type as keyof ObjectFamily).createAtom(initialObject.objectId)
      : undefined
  const targetObject = objectAtom && useGlobalAtomValue(objectAtom)
  const defaultLayout = [
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
    object?.type
      ? {
          type: 'fromDisplayer',
          object,
          onRemove: () => {
            setObject(s => {
              delete s.fromObject
              return { ...s }
            })
          }
        }
      : undefined,
    object?.type === 'localFile'
      ? {
          type: 'filePathPicker',
          filePath: (targetObject as ILocalFile)?.fileUrl,
          onChange: (path, name) => {
            object.objectId &&
              ObjectStore('localFile').updateOne({
                id: object.objectId,
                fileUrl: path
              })
            setObject(o => ({
              ...o,
              name: getFilenameWithoutExtension(name || '')
            }))
          }
        }
      : undefined,
    object?.type === 'video'
      ? {
          type: 'filePathPicker',
          enableWeb: true,
          filePath: (targetObject as IVideo)?.videoUrl,
          onChange: (path, name, file) => {
            if (path && name && file) {
              saveFileLocally(path, name).then(p => {
                object.objectId &&
                  ObjectStore('video').updateOne({
                    id: object.objectId,
                    videoUrl: p.data
                  })
                generateVideoThumbnail(file).then(s => {
                  saveImageLocally(s, { compress: false }).then(data => {
                    setObject(o => ({ ...o, coverImgSrc: data }))
                  })
                })
                setObject(o => ({
                  ...o,
                  name: getFilenameWithoutExtension(name)
                }))
              })
              return
            } else if (path && name) {
              setObject(o => ({ ...o, name }))
              if (object.objectId) {
                fetchHead(path).then(res => {
                  setObject(o => ({ ...o, name: res.title || name, coverImgSrc: res.coverImgSrc }))
                  if (MetaStore.getMetaObjectsMap().has(object.id)) {
                    const meta = MetaStore.getMetaObjectsMap().get(object.id)
                    MetaStore.updateMetaObject(
                      {
                        id: object.id,
                        coverImgSrc: res.coverImgSrc || meta?.coverImgSrc,
                        name: res.title || meta?.name
                      },
                      true
                    )
                  }
                })
                ObjectStore('video').updateOne({ id: object.objectId, videoUrl: path })
              }
            } else {
              object.objectId &&
                ObjectStore('video').updateOne({
                  id: object.objectId,
                  videoUrl: undefined
                })
              setObject(o => ({
                ...o,
                name: undefined,
                coverImgSrc: undefined
              }))
            }
          },
          accept: 'video/*,.flv'
        }
      : undefined,
    object.attachments?.length ? { type: 'attachmentDisplayer', attachments: object.attachments } : undefined,
    {
      type: 'group',
      children: [
        initialObject?.type === 'note'
          ? {
              type: 'custom',
              children: <FormNoteImporter onClose={() => onBack?.()} />
            }
          : undefined,
        initialObject?.type === 'image' && initialObject?.coverImgSrc
          ? {
              type: 'custom',
              children: (
                <Button.IconButton
                  spin={ocrLoading}
                  icon={ocrLoading ? 'park-loading-four' : 'park-text-recognition'}
                  className={ClassName.flatButton()}
                  text={ocrLoading ? t('general.loading') : t('general.recognize text in image')}
                  onClick={async () => {
                    if (ocrLoading) return
                    toggleOcrLoading(true)
                    try {
                      const fileUrl = initialObject.coverImgSrc!
                      const image = await fetch(fileUrl).then(res => res.blob())
                      const result = await OcrService.ocrImage(image)
                      const desc = result?.result.map(i => i.words).join(' ')
                      const { name, description } = transformTextContentToNameAndDescription(desc)
                      setObject(s => ({ ...s, name, description }))
                    } catch (e) {
                      toast.error('Failed to recognize text!')
                    } finally {
                      toggleOcrLoading(false)
                    }
                  }}
                ></Button.IconButton>
              )
            }
          : undefined,
        {
          type: 'imagePicker',
          imageUrl: object.coverImgSrc,
          onChange: v => setObject({ ...object, coverImgSrc: v }),
          name: object.name || ''
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
          type: 'attchmentManager',
          attachments: object.attachments,
          onChange: atts => setObject({ ...object, attachments: atts }),
          metaId: object.id
        },
        {
          type: 'tagPicker',
          tags: object.tags,
          onChange: v => setObject({ ...object, tags: v })
        }
      ]
    }
  ]
  const customizedLayout = initialObject?.type
    ? TypeToRegisteredMetaObject.get(initialObject?.type)?.customEditForm?.(object, setObject, targetObject)
    : undefined
  const { renderForm } = useFlipForm({
    layout: customizedLayout || defaultLayout,
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
