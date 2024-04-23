import Id from '@/utils/id'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IForm } from './types'
import useFlipForm from './useFlipForm'
import { ObjectStore } from '@/api/stores'
import { ObjectFamily } from '@/api/stores/object/object.store'
import { useGlobalAtomValue } from '@/hooks'
import OcrService from '@/api/services/ocr.service'
import ClassName from '@/styles/classNames'
import { Button } from '../base'
import { toast } from 'react-hot-toast'
import { TypeToRegisteredMetaObject } from '@/api/stores/meta/meta.store'
import { IFile, MetaFormLayoutItem, MetaObject } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'

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
  const [originObject, setOriginObject] = useState<any>()
  useEffect(() => {
    if (object.objectId) {
      ObjectStore(object.type)
        .getOneById(object.objectId)
        .then(o => setOriginObject(o))
    }
  }, [object.objectId])

  let fileAccept = ''
  switch (object.type) {
    case 'video': {
      fileAccept = 'video/*,.flv'
      break
    }
    case 'audio': {
      fileAccept = 'audio/*'
      break
    }
    case 'image': {
      fileAccept = 'image/*'
      break
    }
    case 'localFile': {
      fileAccept = '*'
      break
    }
    case 'pdf': {
      fileAccept = 'application/pdf'
      break
    }
  }
  let showUrl = false
  if (object.type === 'webpage') {
    showUrl = true
  }
  if (object.type === 'tweet') {
    showUrl = true
  }

  const defaultLayout: MetaFormLayoutItem[] = [
    showUrl
      ? {
          type: 'input',
          autoFocus: true,
          text: t('general.url'),
          value: originObject?.url,
          onEnter: () => {
            onSubmit?.(object)
            if (originObject) {
              ObjectStore(object.type).updateOne({ id: originObject.id, ...originObject })
            }
          },
          onChange: async v => {
            setOriginObject(o => ({ ...o, url: v }))
            if (v) {
              try {
                new URL(v)
              } catch (e) {
                return
              }
              const result = await Rendevoz.Utils.Web.fetchDetails(v)
              setObject(s => ({ ...s, name: result.title, coverImgSrc: result.image, description: result.description }))
            }
          }
        }
      : undefined,
    {
      type: 'nameInput',
      autoFocus: !showUrl,
      value: object.name,
      onChange: v => setObject({ ...object, name: v })
    },
    {
      type: 'descriptionInput',
      value: object.description,
      onChange: v => setObject({ ...object, description: v })
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
    object?.type && ['localFile', 'pdf', 'video', 'audio', 'image'].includes(object.type)
      ? {
          type: 'filePathPicker',
          accept: fileAccept,
          onEnter: () => {
            onSubmit?.(object)
            if (originObject) {
              ObjectStore(object.type).updateOne({ id: originObject.id, ...originObject })
            }
          },
          filePath: (originObject as IFile)?.url,
          enableWeb: ['video', 'audio', 'image'].includes(object.type),
          enableBaidudisk: ['video'].includes(object.type),
          onChange: async details => {
            if (details.type === 'local' && details.file) {
              try {
                const result = await Rendevoz.Utils.Meta.normalizeLocalFileToMeta(details.file, {
                  limitType: object.type !== 'localFile'
                })
                setObject(o => ({ ...o, ...result.meta }))
                if (originObject) {
                  setOriginObject(i => ({ ...i, ...result.object }))
                }
              } catch (e) {
                toast.error(Rendevoz.Consts.Errors.NotSupportedFile())
                console.error(e)
              }
            }
            if (details.type === 'baidudisk') {
              setObject(o => ({ ...o, name: details.name }))
              if (originObject) {
                setOriginObject(o => ({ ...o, url: `baidudisk${details.url}` }))
              }
            }
            if (details.type === 'web') {
              if (originObject) {
                setOriginObject(o => ({ ...o, url: details.url }))
              }
              const result = await Rendevoz.Utils.Meta.normalizeWebFileToMeta(details.url, object.type)
              console.log(result)
              setObject(o => ({ ...o, ...result.meta }))
              if (originObject) {
                setOriginObject(i => ({ ...i, ...result.object }))
              }
            }
            if (details.type === 'clear') {
              if (originObject) {
                setOriginObject(i => ({ ...i, url: undefined }))
              }
            }
          }
        }
      : undefined,
    object.attachments?.length ? { type: 'attachmentDisplayer', attachments: object.attachments } : undefined,
    {
      type: 'group',
      children: [
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
                      const fileUrl = object.coverImgSrc!
                      const image = await fetch(fileUrl).then(res => res.blob())
                      const result = await OcrService.ocrImage(image)
                      const desc = result?.result.map(i => i.words).join(' ')
                      setObject(s => ({ ...s, description: desc }))
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
          type: 'addDesc',
          value: object.description
        },
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
    onSubmit: () => {
      onSubmit?.(object)
      if (originObject) {
        console.log(originObject)
        ObjectStore(object.type).updateOne({ id: originObject.id, ...originObject })
      }
    },
    formTitle: initialObject?.id
      ? t('form.update item details', { item: t('general.object') })
      : t('form.create new item', { item: t('general.object') }),
    submitText: initialObject?.id ? 'update' : 'create'
  })
  return renderForm()
}

export default ObjectForm
