import { ObjectStore } from '@/api/stores'
import { AnimatePopover, Button, Content, Icon, WithBorder } from '@/components'
import { useEffect, useMemo, useRef, useState } from 'react'
import FeedSidebarItem from '@/core/components/feed/components/FeedSidebarItem'
import { ClassName } from 'rendevoz'
import ContextMenu from '@/components/contextMenu'
import isHotkey from 'is-hotkey'
import { Colors, KEY } from '@/consts'
import { useTranslation } from 'react-i18next'

export default ({ folderId }: { folderId: number }) => {
  const folder = ObjectStore('feedFolder').useValue(folderId)
  const folded = folder?.folded ?? true
  const [isRename, setIsRename] = useState(false)
  const [folderUnread, setFolderUnread] = useState(0)
  useEffect(() => {
    if (folder?.collections.length) {
      Promise.all(
        folder.collections.map(async id => {
          return (await ObjectStore('feedCollection').getOneById(id))?.unreadCount || 0
        })
      )
        .then(res => res.reduce((pre, curr) => pre + curr, 0))
        .then(result => {
          setFolderUnread(result)
        })
    }
  }, [folder?.collections, folded])
  const { t } = useTranslation()
  return (
    <Content>
      <ContextMenu
        content={setV => (
          <WithBorder padding={4} width={160} style={{ fontSize: 14 }}>
            <Button.IconButton
              icon={'park-edit'}
              text={t('general.rename')}
              onClick={() => {
                setIsRename(true)
                setV(false)
              }}
            />
            <Button.IconButton
              icon={'park-delete-one'}
              text={t('general.delete')}
              onClick={() => {
                ObjectStore('feedFolder').deleteOneById(folderId)
                setV(false)
              }}
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
                ObjectStore('feedFolder').updateOne({ id: folderId, name: e.currentTarget.value || 'Unnamed folder' })
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
            defaultValue={folder?.name}
            onBlur={e => {
              setIsRename(false)
              ObjectStore('feedFolder').updateOne({ id: folderId, name: e.target.value || 'Unnamed folder' })
            }}
          />
        ) : (
          <Content
            onClick={() => {
              ObjectStore('feedFolder').updateOne({ id: folderId, folded: !folded })
            }}
            flex
            gap={4}
            alignItems={'center'}
            style={{ paddingLeft: 4 }}
            className={ClassName.flatButton()}
          >
            <Icon
              theme={'filled'}
              name={'park-right-one'}
              style={{
                transform: !folded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'all 0.2s ease'
              }}
            />
            <Icon name={'park-folder-close'} />
            <div style={{ marginLeft: 4 }} className={ClassName.ellipsisFont(1)}>
              {folder?.name}
            </div>
            {folderUnread > 0 && <div style={{ marginLeft: 'auto', fontSize: 13, color: Colors.Font.Transparent }}>{folderUnread}</div>}
          </Content>
        )}
      </ContextMenu>
      {!folded && (
        <Content style={{ paddingLeft: 10 }}>
          {folder?.collections.map(id => <FeedSidebarItem parentFolderId={folderId} collectionId={id} />)}
        </Content>
      )}
    </Content>
  )
}
