import useFeedState from '@/core/feed/hooks/useFeedState'
import useFeedInstance from '@/core/feed/hooks/useFeedInstance'
import { assignProperties } from '@/utils'
import { useRef, useState } from 'react'
import { IFeedFolder } from '~/typings'
import Id from '@/utils/id'
import { Content, Modal } from '@/components'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
import { ObjectStore } from '@/api/stores'

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

  const renderModal = () => {
    return (
      <Modal onClose={() => setFolderState(undefined)} visible={!!folderState?.visible}>
        <Content
          flex
          column
          gap={16}
          style={{
            width: 360,
            padding: '16px 24px'
          }}
        >
          <div style={{ fontSize: 14, color: Colors.Font.Transparent }}>Folder name</div>
          <input
            style={{
              width: '100%',
              marginBottom: 20,
              borderBottom: `1px solid ${Colors.Background.Border}`
            }}
            onChange={e => {
              setFolderState(s => ({
                ...s,
                currentFolder: {
                  ...s.currentFolder,
                  name: e.target.value
                }
              }))
            }}
            className={ClassName.noStyleInput}
          />
          <Content flex justifyContent={'space-between'}>
            <div
              onClick={() => {
                promiseRef.current?.reject?.()
                promiseRef.current = undefined
                setFolderState(undefined)
              }}
              className={ClassName.flatButton(undefined, '4px 12px', undefined, true)}
            >
              {t('general.Cancel')}
            </div>
            <div
              onClick={async () => {
                const newFolder = await ObjectStore('feedFolder').addOne({ ...(folderState?.currentFolder || {}) })
                promiseRef.current?.resolve?.(newFolder)
                promiseRef.current = undefined
                setFolderState(undefined)
              }}
              className={ClassName.flatButton(undefined, '4px 12px', undefined, true)}
            >
              {t('general.confirm')}
            </div>
          </Content>
        </Content>
      </Modal>
    )
  }

  return {
    renderModal
  }
}
