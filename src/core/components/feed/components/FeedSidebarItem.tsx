import ContextMenu from '@/components/contextMenu'
import { AnimatePopover, Button, Content, WithBorder } from '@/components'
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

export default ({ collectionId, parentFolderId }: { collectionId: number; parentFolderId?: number }) => {
  const { t } = useTranslation()
  const setFeedState = useSetAtom(FeedStateAtom)
  const [isRename, setIsRename] = useState(false)
  const instance = UseFeedInstance()
  const c = ObjectStore('feedCollection').useValue(collectionId)
  const allFolders = useGlobalAtomValue(ObjectStore('feedFolder').objectMapAtom)
  const ref = useRef()
  if (!c) return null
  return (
    <ContextMenu
      ref={ref}
      content={
        <WithBorder padding={4} width={160} style={{ fontSize: 14 }}>
          <Button.IconButton
            icon={'park-edit'}
            text={t('general.rename')}
            onClick={() => {
              setIsRename(true)
              ref.current?.closeContextMenu?.()
            }}
          />
          <AnimatePopover
            positions={['right']}
            align={'start'}
            content={
              <WithBorder width={160} padding={4} style={{ fontSize: 14, maxHeight: 400, overflowY: 'auto' }}>
                {parentFolderId && (
                  <div
                    className={ClassName.flatButton(4, '2px 6px')}
                    onClick={async () => {
                      const parentFolder = await ObjectStore('feedFolder').getOneById(parentFolderId)
                      if (parentFolder) {
                        await ObjectStore('feedFolder').updateOne({
                          id: parentFolderId,
                          collections: parentFolder.collections.filter(i => i !== collectionId)
                        })
                      }
                    }}
                  >
                    Move to root
                  </div>
                )}
                <div
                  className={ClassName.flatButton(4, '2px 6px')}
                  onClick={() => {
                    instance.folderOps?.createFolder().then(f => {
                      ObjectStore('feedFolder').updateOne({ id: f.id, collections: [collectionId] })
                    })
                  }}
                >
                  Assign to new folder
                </div>
                {/*<div style={{ height: 1, width: '100%', margin: '4px 0px', background: Colors.Background.Border }}></div>*/}
                {Array.from(allFolders.values()).map(
                  i =>
                    i.id !== parentFolderId && (
                      <div
                        className={ClassName.flatButton(4, '2px 6px')}
                        onClick={() => {
                          ObjectStore('feedFolder').updateOne({ id: i.id, collections: [...i.collections, collectionId] })
                        }}
                      >
                        {i.name}
                      </div>
                    )
                )}
              </WithBorder>
            }
          >
            <Button.IconButton suffixIcon={'park-right'} icon={'park-folder-close'} text={t('general.Move to')} />
          </AnimatePopover>
          <Button.IconButton
            icon={'park-delete'}
            dangerous
            text={t('general.delete')}
            onClick={() => {
              deleteCollection(collectionId)
              ref.current?.closeContextMenu?.()
            }}
          />
        </WithBorder>
      }
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
          className={ClassName.flatButton(4, '2px 6px')}
          flex
          justifyContent={'space-between'}
          gap={10}
        >
          <Content flex alignItems={'center'} gap={10}>
            {c.icon && <img src={c.icon} width={20} height={20} style={{ objectFit: 'cover', borderRadius: 999 }} />}
            <div className={ClassName.ellipsisFont(1)}>{c.name}</div>
          </Content>
          {c.unreadCount !== undefined && c.unreadCount > 0 && (
            <div style={{ fontSize: 13, color: Colors.Font.Transparent }}>{c.unreadCount}</div>
          )}
        </Content>
      )}
    </ContextMenu>
  )
}
