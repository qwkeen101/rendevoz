import { memo, useState } from 'react'
import { ObjectStore } from '@/api/stores'
import { AnimatePopover, AutosizeTextarea, Icon, Menu, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import KeyvalueStore from '@/api/stores/keyvalue.store'

const width = 280
export default memo(
  ({
    type,
    onSave,
    initialFolderId,
    currentName,
    onRemove
  }: {
    type: 'feedFolder' | 'youtubeFolder' | 'podcastFolder'
    currentName: string
    initialFolderId?: number | (() => number | undefined)
    onSave: (name: string, folderId?: number) => void
    onRemove: VoidFunction
  }) => {
    const { t } = useTranslation()
    const allFolders = ObjectStore(type).useAll()
    const saveFolderCache = KeyvalueStore.useValue('saveFolder')?.[type]
    const handleSave = () => {
      onSave(state.name, state.folder)
      KeyvalueStore.updateOne('saveFolder', { ...(KeyvalueStore.getOne('saveFolder') || {}), [type]: state.folder })
    }
    const [state, setState] = useState<{
      name: string
      folder?: number
    }>({
      name: currentName,
      folder: (typeof initialFolderId === 'number' ? initialFolderId : initialFolderId?.()) ?? saveFolderCache
    })
    return (
      <WithBorder className={'p-3'}>
        <div className={'font-medium mb-3'}>{t('feed.Save to')}</div>
        <div className={'menu-sub-title mb-2'}>{t(trans.Name)}</div>
        <AutosizeTextarea
          style={{
            width
          }}
          onChange={v => setState(s => ({ ...s, name: v }))}
          value={state.name || ''}
          autoFocus
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              e.preventDefault()
              handleSave()
            }
          }}
          autoFocusDelay={100}
          className={'focus-input w-full font-size-13 bg-input px-2 py-1.5 border-box-shadow rounded-md'}
        />
        <div className={'menu-sub-title mt-3 mb-2'}>{t('general.Folder')}</div>
        <AnimatePopover
          positions={['bottom']}
          content={setVisible => (
            <WithBorder onClick={e => e.stopPropagation()} style={{ width }} className={'py-1.5'}>
              <Menu.NavigationMenu
                layout={[
                  {
                    type: 'title',
                    name: t('feed.Select a folder')
                  },
                  {
                    type: 'item',
                    key: 'library',
                    text: t(trans.Feed.Library),
                    onSelect: () => {
                      setState(s => ({ ...s, folder: undefined }))
                      setVisible(false)
                    }
                  },
                  ...allFolders
                    .toSorted((a, b) => b.createdAt - a.createdAt)
                    .map(i => ({
                      type: 'item',
                      key: i.id.toString(),
                      text: i.name,
                      onSelect: () => {
                        setVisible(false)
                        setState(s => ({ ...s, folder: i.id }))
                      }
                    })),
                  {
                    type: 'separator'
                  },
                  {
                    type: 'item',
                    key: 'new',
                    text: t('general.New folder'),
                    onSelect: () => {
                      Global.dialogOps?.createOrEditFolder<(typeof allFolders)[0]>(type).then(res => {
                        setState(s => ({ ...s, folder: res.id }))
                        setVisible(false)
                      })
                    }
                  }
                ]}
              />
            </WithBorder>
          )}
        >
          <div
            style={{
              width
            }}
            className={
              'flex select-none justify-between gap-6 items-center font-size-13 w-full bg-input cursor-pointer px-2 py-1.5 border-box-shadow rounded-md'
            }
          >
            <div className={'line-clamp-1'}>{state.folder ? allFolders.find(i => i.id === state.folder)?.name : t(trans.Feed.Library)}</div>
            <Icon name={'park-down'} className={'super-transparent-font'} size={15} strokeWidth={6} />
          </div>
        </AnimatePopover>
        <div className={'flex justify-end font-size-13 gap-2 mt-6 font-medium'}>
          <div onClick={onRemove} className={'has-bg-button cursor-pointer px-5 py-2 rounded-3xl'}>
            {t('feed.Remove')}
          </div>
          <div
            onClick={() => {
              handleSave()
            }}
            className={'reverse-theme-button px-5 py-2 !rounded-3xl'}
          >
            {t('feed.Confirm')}
          </div>
        </div>
      </WithBorder>
    )
  }
)
