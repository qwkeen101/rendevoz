import useFeedState from '@/core/components/feed/hooks/useFeedState'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { assignProperties } from '@/utils'
import { useRef, useState } from 'react'
import { IFeedFolder } from '~/typings'
import Id from '@/utils/id'
import { Content, Footer, Modal } from '@/components'
import { Colors, KEY } from '@/consts'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
import { ObjectStore } from '@/api/stores'
import BorderInput from '@/components/base/BorderInput'
import isHotkey from 'is-hotkey'

export default () => {
  const instance = useFeedInstance()
  const [folderState, setFolderState] = useState<{
    visible: boolean
    currentFolder: Partial<IFeedFolder>
  }>()
  const { t } = useTranslation()
  const promiseRef = useRef()
  assignProperties(instance, {
    folderOps: {
      createFolder: c => {
        return new Promise((resolve, reject) => {
          promiseRef.current = {
            resolve,
            reject
          }
          setFolderState({
            visible: true,
            currentFolder: {
              collections: [],
              id: Id.getId(),
              ...c
            }
          })
        })
      }
    }
  })
  const handleSubmit = async () => {
    const newFolder = await ObjectStore('feedFolder').addOne({ ...(folderState?.currentFolder || {}) })
    promiseRef.current?.resolve?.(newFolder)
    promiseRef.current = undefined
    setFolderState(undefined)
  }
  const renderModal = () => {
    return (
      <Modal onClose={() => setFolderState(undefined)} visible={!!folderState?.visible}>
        <Content
          style={{
            width: 400,
            padding: '18px 24px'
          }}
        >
          <div style={{ fontSize: 18, marginBottom: 20 }} className={'bold-font'}>
            {t('feed.Edit folder details')}
          </div>
          <BorderInput
            autoFocus
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                handleSubmit()
              }
            }}
            placeholder={t('general.name')}
            containerStyle={{
              width: '100%',
              marginBottom: 24
            }}
            style={{
              padding: '8px 12px'
            }}
            onChange={e => {
              setFolderState(s => ({
                ...s,
                currentFolder: {
                  ...s.currentFolder,
                  name: e
                }
              }))
            }}
          />
          <Footer
            onBack={() => {
              promiseRef.current?.reject?.()
              promiseRef.current = undefined
              setFolderState(undefined)
            }}
            onSubmit={() => {
              handleSubmit()
            }}
          ></Footer>
        </Content>
      </Modal>
    )
  }

  return {
    renderModal
  }
}
