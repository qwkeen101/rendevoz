import ContextMenu from '@/components/contextMenu'
import { AnimatePopover, Button, Content, Menu, WithBorder } from '@/components'
import deleteCollection from '@/core/components/feed/utils/deleteCollection'
import { ClassName } from 'rendevoz'
import { useSetAtom } from 'jotai'
import { FeedStateAtom } from '@/core/components/feed/hooks/useFeedState'
import { useTranslation } from 'react-i18next'
import { ObjectStore } from '@/api/stores'
import { useRef, useState } from 'react'
import { Colors, KEY } from '@/consts'
import isHotkey from 'is-hotkey'
import { css } from '@emotion/css'
import UseFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { useGlobalAtomValue } from '@/hooks'
import { fetchMoreItemsForCollection } from '@/core/components/feed/hooks/useFeedCollectionContent'

export default ({ collectionId, parentFolderId }: { collectionId: number; parentFolderId?: number }) => {
  const { t } = useTranslation()
  const setFeedState = useSetAtom(FeedStateAtom)
  const [isRename, setIsRename] = useState(false)
  const instance = UseFeedInstance()
  const c = ObjectStore('feedCollection').useValue(collectionId)
  const allFolders = useGlobalAtomValue(ObjectStore('feedFolder').objectMapAtom)
  if (!c) return null
  // @ts-ignore
  return (
    <ContextMenu
      content={setV => (
        <WithBorder padding={'0.4rem 0'} width={180} style={{ fontSize: 14 }}>
          <Menu.NavigationMenu
            layout={[
              {
                type: 'item',
                text: t('feed.Refresh content'),
                key: 'refresh',
                icon: 'park-refresh',
                onSelect: () => {
                  setV(false)
                  fetchMoreItemsForCollection(collectionId)
                }
              },
              {
                type: 'item',
                text: t('general.edit'),
                key: 'edit',
                icon: 'park-edit',
                onSelect: () => {
                  setV(false)
                  instance.editFeed?.(collectionId)
                }
              },
              {
                type: 'item',
                key: 'move-to',
                text: t('general.Move to'),
                subMenuStyle: { width: 200 },
                icon: 'park-folder-close',
                subMenu: [
                  {
                    type: 'item',
                    key: 'create-folder',
                    text: t('feed.Create new folder'),
                    icon: 'park-folder-plus',
                    onSelect: async () => {
                      setV(false)
                      instance.folderOps?.createFolder().then(f => {
                        ObjectStore('feedFolder').updateOne({ id: f.id, collections: [collectionId] })
                      })
                    }
                  },
                  parentFolderId
                    ? {
                        type: 'item',
                        key: 'move-out',
                        text: t('feed.Move out from folder'),
                        icon: 'park-folder-withdrawal',
                        onSelect: async () => {
                          setV(false)
                          const parentFolder = await ObjectStore('feedFolder').getOneById(parentFolderId)
                          if (parentFolder) {
                            await ObjectStore('feedFolder').updateOne({
                              id: parentFolderId,
                              collections: parentFolder.collections.filter(i => i !== collectionId)
                            })
                          }
                        }
                      }
                    : undefined,
                  Array.from(allFolders.values()).filter(i => i.id !== parentFolderId).length
                    ? {
                        type: 'title',
                        name: t('feed.Assign to folder')
                      }
                    : undefined,
                  // @ts-ignore
                  ...Array.from(allFolders.values()).map(i =>
                    i.id !== parentFolderId
                      ? {
                          type: 'item',
                          key: String(i.id),
                          text: i.name,
                          onSelect: () => {
                            ObjectStore('feedFolder').updateOne({ id: i.id, collections: [...i.collections, collectionId] })
                          }
                        }
                      : undefined
                  )
                ].filter(i => i)
              },
              {
                type: 'item',
                key: 'delete',
                text: t('general.delete'),
                icon: 'park-delete',
                onSelect: () => {
                  deleteCollection(collectionId)
                  setV(false)
                }
              }
            ]}
          />
        </WithBorder>
      )}
      position={['right', 'left']}
    >
      {isRename ? (
        <input
          autoFocus
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              setIsRename(false)
              ObjectStore('feedCollection').updateOne({ id: collectionId, name: e.currentTarget.value || 'Unnamed feed' })
            }
            if (isHotkey(KEY.Escape, e)) {
              setIsRename(false)
            }
          }}
          style={{
            boxShadow: `0 0 0 2px ${Colors.Common.SelectColor}`,
            padding: '2px 6px',
            borderRadius: 4
          }}
          className={ClassName.noStyleInput}
          defaultValue={c.name}
          onBlur={e => {
            setIsRename(false)
            ObjectStore('feedCollection').updateOne({ id: collectionId, name: e.target.value || 'Unnamed feed' })
          }}
        />
      ) : (
        <Content
          onClick={() => {
            setFeedState(s => ({
              ...s,
              currentVisiblePage: 'feeds',
              currentCollectionId: collectionId,
              currentFocusedFeedItemId: undefined,
              headerName: undefined
            }))
          }}
          className={ClassName.flatButton()}
          flex
          justifyContent={'space-between'}
          gap={10}
        >
          <Content flex alignItems={'center'} gap={10}>
            {c.icon && <img src={c.icon} width={20} height={20} style={{ objectFit: 'cover', borderRadius: 999 }} />}
            <div className={'ellipsis-font-1'}>{c.name}</div>
          </Content>
          {c.unreadCount !== undefined && c.unreadCount > 0 && <div className={'font-size-12 transparent-font'}>{c.unreadCount}</div>}
        </Content>
      )}
    </ContextMenu>
  )
}
