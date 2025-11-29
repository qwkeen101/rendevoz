import { useState } from 'react'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { assignProperties } from '@/utils'
import { IYoutubeFolder } from '~/typings'
import { Footer, Modal } from '@/components'
import BorderInput from '@/components/base/BorderInput'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { useTranslation } from 'react-i18next'
import { ObjectStore } from '@/api/stores'

export default () => {
  const [state, setState] = useState<{
    visible: boolean
    promise?: {
      res?: any
      rej?: any
    }
    folder?: Partial<IYoutubeFolder>
  }>({
    visible: false
  })
  const { t } = useTranslation()
  const instance = useFeedInstance()
  assignProperties(instance, {
    youtubeOps: {
      ...instance.youtubeOps,
      assignToFolder: async (id, s) => {},
      createFolder: currentFolder => {
        return new Promise((res, rej) => {
          setState(s => ({
            visible: true,
            promise: {
              res,
              rej
            },
            folder: {
              items: [],
              ...currentFolder
            }
          }))
        })
      }
    }
  })
  const handleSubmit = async () => {
    const newFolder = await ObjectStore('youtubeFolder').addOne({ ...(state?.folder || {}) })
    state.promise?.res(newFolder)
    setState({ visible: false })
  }
  return (
    <Modal
      onClose={() => {
        state.promise?.rej()
        setState({ visible: false })
      }}
      visible={!!state.visible}
    >
      <div className={'p-6 flex flex-col gap-6 w-[90vw] max-w-lg'}>
        <div className={'font-bold text-xl'}>{t('feed.Edit folder details')}</div>
        <BorderInput
          autoFocus
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              handleSubmit()
            }
          }}
          defaultValue={state?.folder?.name}
          placeholder={t('general.name')}
          containerStyle={{
            width: '100%'
          }}
          style={{
            padding: '8px 12px'
          }}
          onChange={e => {
            setState(s => ({
              ...s,
              folder: {
                ...s.folder,
                name: e
              }
            }))
          }}
        />
        <Footer
          onBack={() => {
            state.promise?.rej()
            setState({ visible: false })
          }}
          onSubmit={() => {
            handleSubmit()
          }}
        ></Footer>
      </div>
    </Modal>
  )
}
