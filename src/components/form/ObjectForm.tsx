import Id from '@/utils/id'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IForm } from './types'
import { ObjectStore } from '@/api/stores'
import { MetaObject } from '~/typings'
import trans from '@/consts/trans'
import { AutosizeTextarea, Button, FormFooter, Icon } from '@/components'
import { Colors, Icons } from '@/consts'
import FileSystem from '@/api/fileSystem'
import FormFilePathPicker from '@/components/form/objectEdit/FormFilePathPicker'
import FormTagPicker from '@/components/form/objectEdit/FormTagPicker'
import FormHiddenSwitcher from '@/components/form/objectEdit/FormHiddenSwitcher'
import queueTurnUnhidden from '@/api/stores/meta/queueTurnUnhidden'

const ObjectForm: FC<IForm<MetaObject>> = ({ onBack, onSubmit, initialObject }) => {
  const [object, setObject] = useState({ id: Id.getId(), ...initialObject })
  const { t } = useTranslation()
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
  const showFilePicker = object.type && ['localFile', 'webpage', 'pdf', 'video', 'audio', 'image', 'cloudFile'].includes(object.type)
  return (
    <div
      style={{
        width: 'min(90vw, 450px)',
        borderRadius: 12,
        overflow: 'hidden'
      }}
      className={'flex flex-col'}
    >
      <div style={{ maxHeight: '70vh' }} className={'flex flex-col w-full relative overflow-y-auto'}>
        <div
          style={{
            backgroundImage: `url('${object.coverImgSrc}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          className={'bg-third h-24 mb-14 shrink-0 relative w-full'}
        >
          <div
            onClick={() => {
              Global.commonOps
                ?.upload({
                  accept: 'image/*'
                })
                .then(f => {
                  if (f instanceof File) {
                    FileSystem.saveImage(f).then(res => {
                      setObject(s => ({ ...s, coverImgSrc: res }))
                    })
                  }
                })
            }}
            style={{
              borderColor: Colors.Background.Global
            }}
            className={
              'absolute left-4 bg-popover bottom-0 translate-y-1/2 rounded-full overflow-hidden flex items-center justify-center cursor-pointer z-20 size-28 shadow-lg border-2 border-solid'
            }
          >
            {object.coverImgSrc ? (
              <img src={object.coverImgSrc} className={'w-full h-full object-cover'} />
            ) : (
              <Icon name={'park-upload-picture'} className={'opacity-30'} size={24} />
            )}
          </div>
          <div className={'absolute transparent-font font-size-12 p-3 right-0 bottom-0 translate-y-full flex gap-2'}>
            {object.coverImgSrc && (
              <Button.IconButton text={t('general.Remove cover')} onClick={() => setObject(s => ({ ...s, coverImgSrc: undefined }))} />
            )}
            <Button.IconButton text={t(trans.Meta.ViewDetails)} onClick={() => Global.metaOps.openDetails?.(object.id)} />
          </div>
        </div>
        <div className={'flex flex-col w-full p-5 gap-3'}>
          <div className={'mb-1 w-full'}>
            <AutosizeTextarea
              className={'font-bold text-xl mb-2 w-full'}
              onChange={v => setObject(s => ({ ...s, name: v }))}
              value={object.name}
              placeholder={t(trans.Unnamed)}
            />
            <AutosizeTextarea
              placeholder={t('group.Add description')}
              value={object.description}
              className={'w-full transparent-font'}
              onChange={v => setObject(s => ({ ...s, description: v }))}
            />
          </div>
          {object.id ? (
            <FormHiddenSwitcher hidden={!!object.hidden} onChange={v => setObject(s => ({ ...s, hidden: v }))} id={object.id} />
          ) : null}
          {showFilePicker && originObject && (
            <FormFilePathPicker
              value={originObject.url}
              accept={fileAccept}
              onChange={v => setOriginObject(s => ({ ...s, url: v }))}
              enable={
                object.type
                  ? {
                      local: ['video', 'audio', 'image', 'pdf'].includes(object.type),
                      baidu: ['cloudFile', 'video'].includes(object.type),
                      web: ['video', 'audio', 'image', 'webpage', 'tweet'].includes(object.type)
                    }
                  : undefined
              }
            />
          )}
          <FormTagPicker tags={object.tags} onChange={v => setObject(s => ({ ...s, tags: v }))} />
        </div>
      </div>
      <FormFooter
        onCancel={onBack}
        onConfirm={() => {
          onSubmit?.(object)
          if (initialObject?.hidden && !object.hidden) {
            queueTurnUnhidden({
              metaId: object.id,
              type: 'object',
              force: true
            })
          }
        }}
        className={'border-top p-4 px-5'}
        left={
          <div
            className={
              'dark:bg-red-900 bg-red-200 hover:!bg-opacity-40 font-medium !bg-opacity-30 text-red-500 gap-2.5 flex cursor-pointer items-center rounded-lg px-4 py-1.5'
            }
          >
            <Icon name={Icons.Delete} />
            <div>{t(trans.Delete)}</div>
          </div>
        }
      />
    </div>
  )
}

export default ObjectForm
