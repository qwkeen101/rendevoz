import { useEffect, useMemo, useState } from 'react'
import { Button, Content } from '@/components'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { ObjectStore } from '@/api/stores'
import useFeedState from '@/core/components/feed/hooks/useFeedState'
import { useGlobalAtomValue } from '@/hooks'
import { Resizable } from 're-resizable'
import { useTranslation } from 'react-i18next'
import { Colors } from '@/consts'
import FeedSidebarItem from '@/core/components/feed/components/FeedSidebarItem'
import FeedSidebarFolder from '@/core/components/feed/components/FeedSidebarFolder'

const FeedSidebar = () => {
  const [feedState, setFeedState] = useFeedState()
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
    const r = KeyvalueStore.getOne('feedReadLaterIds')
    setFeedState(s => ({
      ...s,
      filteredFeedItems: undefined,
      allFeedItems: r || [],
      currentVisiblePage: 'feeds',
      currentFocusedFeedItemId: undefined,
      currentCollectionId: undefined,
      headerName: t('general.Read later')
    }))
  }
  const workspace = KeyvalueStore.useValue('currentWorkspace')
  useEffect(() => {
    setFeedState({
      allFeedItems: [],
      modalOpen: false,
      isSyncing: false,
      sidebarCollapsed: false,
      openLeftBar: false,
      sidePeekOpen: false,
      currentVisiblePage: 'home'
    })
    ObjectStore('feedCollection').getAll()
    ObjectStore('feedFolder').getAll()
  }, [workspace?.id])
  const handleSetHistory = async () => {
    const history = KeyvalueStore.getOne('feedRecentlyReadIds')
    setFeedState(s => ({
      ...s,
      allFeedItems: history || [],
      filteredFeedItems: undefined,
      currentVisiblePage: 'feeds',
      currentFocusedFeedItem: undefined,
      currentCollectionId: undefined,
      headerName: t('general.History')
    }))
  }
  const { t } = useTranslation()

  return (
    <Resizable
      defaultSize={{ width: 240, height: '100%' }}
      enable={{ right: true }}
      className={'normal-font border-right flex-column'}
      style={{
        paddingTop: 8,
        zIndex: 10,
        opacity: feedState.sidebarCollapsed ? 0 : 1,
        transform: feedState.sidebarCollapsed ? 'translateX(-100%)' : 'unset',
        position: feedState.sidebarCollapsed ? 'absolute' : 'relative',
        top: 0,
        left: 0
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
          text={t('feed.Follow new feeds')}
        ></Button.IconButton>
      </Content>
      <Content flex column style={{ padding: '0px 8px 10px', overflowY: 'auto', flexGrow: 1 }}>
        <div
          style={{
            margin: '6px 6px 4px'
          }}
          className={'font-size-12 transparent-font'}
        >
          {t('general.Feeds')}
        </div>
        <Content flex column>
          {rootFolders?.map(i => <FeedSidebarFolder folderId={i} key={i} />)}
          {rootCollections?.map(i => <FeedSidebarItem collectionId={i} key={i} />)}
        </Content>
        <div
          style={{
            margin: '6px 6px 4px'
          }}
          className={'font-size-12 transparent-font'}
        >
          {t('general.Podcasts')}
        </div>
        <Content flex column>
          {rootPodcasts?.map(i => <FeedSidebarItem collectionId={i} key={i} />)}
        </Content>
      </Content>
    </Resizable>
  )
}

export default FeedSidebar
