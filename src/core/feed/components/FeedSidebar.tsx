import { useMemo, useState } from 'react'
import { Button, Content } from '@/components'
import KeyvalueStore from '@/stores/keyvalue.store'
import { ObjectStore } from '@/stores'
import useFeedState from '@/core/feed/hooks/useFeedState'
import { useGlobalAtomValue } from '@/hooks'
import { Resizable } from 're-resizable'
import { useTranslation } from 'react-i18next'
import { Colors } from '@/consts'
import FeedSidebarItem from '@/core/feed/components/FeedSidebarItem'
import FeedSidebarFolder from '@/core/feed/components/FeedSidebarFolder'

const FeedSidebar = () => {
  const [feedState, setFeedState] = useFeedState()
  ObjectStore('feedCollection').getAll()
  ObjectStore('feedFolder').getAll()
  const allCollections = useGlobalAtomValue(ObjectStore('feedCollection').objectMapAtom)
  const allFolders = useGlobalAtomValue(ObjectStore('feedFolder').objectMapAtom)
  const { rootCollections, rootFolders, rootPodcasts } = useMemo(() => {
    if (allCollections) {
      const inFolderCollections = new Set(
        Array.from(allFolders.values())
          .map(i => i.collections)
          .flat()
      )
      return {
        rootCollections: Array.from(allCollections.values())
          .filter(i => !inFolderCollections.has(i.id) && i.collectionType !== 'podcast')
          .map(i => i.id),
        rootPodcasts: Array.from(allCollections.values())
          .filter(i => !inFolderCollections.has(i.id) && i.collectionType === 'podcast')
          .map(i => i.id),
        rootFolders: Array.from(allFolders.values()).map(i => i.id)
      }
    }
    return {}
  }, [allCollections, allFolders])
  const handleSetReadLater = async () => {
    const r = await KeyvalueStore.getOne('feedReadLaterIds')
    setFeedState(s => ({
      ...s,
      allFeedItems: r || [],
      currentVisiblePage: 'feeds',
      currentFocusedFeedItemId: undefined,
      currentCollectionId: undefined,
      headerName: t('general.Read later')
    }))
  }

  const handleSetHistory = async () => {
    const history = await KeyvalueStore.getOne('feedRecentlyReadIds')
    setFeedState(s => ({
      ...s,
      allFeedItems: history || [],
      currentVisiblePage: 'feeds',
      currentFocusedFeedItem: undefined,
      currentCollectionId: undefined,
      headerName: t('general.History')
    }))
  }
  const { t } = useTranslation()
  const [isResizing, setIsResizing] = useState(false)

  return (
    <Resizable
      onResizeStart={() => setIsResizing(true)}
      onResizeStop={() => setIsResizing(false)}
      defaultSize={{ width: 240, height: '100%' }}
      enable={{ right: true }}
      style={{
        fontWeight: 600,
        fontSize: 14,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 8,
        zIndex: 10,
        borderRight: `1px solid ${Colors.Background.Border}`,
        transform: feedState.sidebarCollapsed ? 'translateX(-100%)' : 'unset',
        position: feedState.sidebarCollapsed ? 'absolute' : 'relative',
        top: 0,
        left: 0,
        transition: 'transform 0.25s ease'
      }}
    >
      <Content flex column gap={4} style={{ padding: '6px 6px' }}>
        <Button.IconButton onClick={() => handleSetReadLater()} icon={'park-star'} text={t('general.Read later')}></Button.IconButton>
        <Button.IconButton onClick={() => handleSetHistory()} icon={'park-history'} text={t('general.History')}></Button.IconButton>
        <Button.IconButton
          onClick={() =>
            setFeedState(s => ({
              ...s,
              currentVisiblePage: 'home',
              allFeedItems: [],
              currentFocusedFeedItemId: undefined,
              currentCollectionId: undefined,
              headerName: undefined
            }))
          }
          icon={'park-plus'}
          text={t('general.Add new feed')}
        ></Button.IconButton>
      </Content>
      <Content flex column style={{ padding: '0px 8px 10px', overflowY: 'auto', flexGrow: 1 }}>
        <div
          style={{
            fontSize: 13,
            color: Colors.Font.Transparent,
            margin: '6px 4px 4px'
          }}
        >
          {t('general.Feeds')}
        </div>
        <Content flex column gap={3}>
          {rootFolders?.map(i => <FeedSidebarFolder folderId={i} key={i} />)}
          {rootCollections?.map(i => <FeedSidebarItem collectionId={i} key={i} />)}
        </Content>
        <div
          style={{
            fontSize: 13,
            color: Colors.Font.Transparent,
            margin: '6px 4px 4px'
          }}
        >
          {t('general.Podcasts')}
        </div>
        <Content flex column gap={3}>
          {rootPodcasts?.map(i => <FeedSidebarItem collectionId={i} key={i} />)}
        </Content>
      </Content>
    </Resizable>
  )
}

export default FeedSidebar
