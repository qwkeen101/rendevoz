import { memo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { assignProperties } from '@/utils'
import { CollectionStore, ObjectStore } from '@/api/stores'
import Id from '@/utils/id'
import { BetterInput, FormFooter, Modal } from '@/components'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { PartialWithId } from '~/typings'
import trans from '@/consts/trans'

export default memo(() => {
  const [folderState, setFolderState] = useState<{
    visible: boolean
    initialize?: boolean
    currentFolder: PartialWithId<{
      name: string
    }>
    type: string
  }>()
  const { t } = useTranslation()
  const promiseRef = useRef()
  assignProperties(Global, {
    dialogOps: {
      ...Global.dialogOps,
      createOrEditFolder: (type, c) => {
        return new Promise((resolve, reject) => {
          promiseRef.current = {
            resolve,
            reject
          }
          if (type === 'custom' && typeof c === 'object') {
            setFolderState({
              visible: true,
              currentFolder: c,
              initialize: false,
              type
            })
            return
          }
          if (c && typeof c === 'object' && 'id' in c && typeof c.id === 'number') {
            if (type === 'collection') {
              CollectionStore.getCollectionById(c.id).then(res => {
                if (res) {
                  setFolderState({
                    visible: true,
                    currentFolder: res,
                    initialize: false,
                    type
                  })
                }
              })
            } else {
              ObjectStore(type)
                .getOneById(c.id)
                .then(res => {
                  if (res) {
                    setFolderState({
                      visible: true,
                      currentFolder: res,
                      initialize: false,
                      type
                    })
                  }
                })
            }

            return
          }
          setFolderState({
            visible: true,
            type,
            currentFolder: {
              id: Id.getId(),
              ...c
            },
            initialize: c?.id ? false : true
          })
        })
      }
    }
  })
  const handleSubmit = async () => {
    if (folderState) {
      if (folderState.type === 'custom') {
        promiseRef.current?.resolve?.(folderState.currentFolder)
        promiseRef.current = undefined
        setFolderState(undefined)
        return
      }
      if (folderState.type === 'collection') {
        const newCollection = await CollectionStore.addCollection({ ...(folderState?.currentFolder || {}) })
        promiseRef.current?.resolve?.(newCollection)
        promiseRef.current = undefined
        setFolderState(undefined)
      } else {
        const newFolder = await ObjectStore(folderState.type).addOne({ ...(folderState?.currentFolder || {}) })
        promiseRef.current?.resolve?.(newFolder)
        promiseRef.current = undefined
        setFolderState(undefined)
      }
    }
  }

  return (
    <Modal onClose={() => setFolderState(undefined)} visible={!!folderState?.visible}>
      <div className={'p-6 flex flex-col w-[90vw] max-w-lg'}>
        <div className={'font-bold text-xl mb-3'}>{folderState?.initialize ? t('general.New folder') : t('feed.Edit folder details')}</div>
        <div className={'small-transparent mb-1'}>{t(trans.Name)}</div>
        <BetterInput
          autoFocus
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              handleSubmit()
            }
          }}
          defaultValue={folderState?.currentFolder.name}
          placeholder={t('general.name')}
          className={'px-3 py-2 focus-input rounded-lg bg-input mb-6'}
          onChange={e => {
            setFolderState(s => ({
              ...s,
              currentFolder: {
                ...s.currentFolder,
                name: e.target.value
              }
            }))
          }}
        />
        <FormFooter
          className={''}
          onConfirm={() => {
            handleSubmit()
          }}
          onCancel={() => {
            promiseRef.current?.reject?.()
            promiseRef.current = undefined
            setFolderState(undefined)
          }}
        />
      </div>
    </Modal>
  )
})
