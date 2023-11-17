import { useRef } from 'react'
import useFeedState from '@/core/components/feed/hooks/useFeedState'
import FeedContainer from '@/core/components/feed/components/FeedContainer'
import { Content, Icon } from '@/components'
import FeedHeaderBar from '@/core/components/feed/components/HeaderBar'
import useArrowNavigation from '@/core/components/feed/hooks/keyboard/useArrowNavigation'
import FeedSidebar from '@/core/components/feed/components/FeedSidebar'
import FeedHomepage from '@/core/components/feed/components/FeedHomepage'
import useFeedCollectionContent from '@/core/components/feed/hooks/useFeedCollectionContent'
import useFeedFolder from '@/core/components/feed/hooks/useFeedFolder'
import { TabTitle } from '@/core/rendevoz/components'

// google news only have webpages
const GoogleNewsViewer = () => {
  const [feedState, setFeedState] = useFeedState()
  useArrowNavigation()
  useFeedCollectionContent()
  const { renderModal } = useFeedFolder()
  const pageContainerRef = useRef<HTMLDivElement>(null)
  return (
    <Content fullWidth fullHeight flex ref={pageContainerRef}>
      <FeedSidebar />
      <TabTitle title={'Feeds'} icon={<Icon name={'park-broadcast'} />} />
      {renderModal()}
      <Content fullHeight auto flex column>
        {feedState.currentVisiblePage === 'feeds' && (
          <>
            <FeedHeaderBar
              collection={{
                icon: 'https://www.inoreader.com/fetch_icon/theverge.com?w=32&cs=1413530204&v=1',
                name: 'The Verge'
              }}
            />
            <Content style={{ height: 0, flex: 1, width: '100%' }}>
              <FeedContainer pageContainer={pageContainerRef.current} />
            </Content>
          </>
        )}
        {feedState.currentVisiblePage === 'home' && <FeedHomepage />}
      </Content>
    </Content>
  )
}

export default GoogleNewsViewer
