import { useRef } from 'react'
import useFeedState from '@/core/feed/hooks/useFeedState'
import FeedContainer from '@/core/feed/components/FeedContainer'
import { Content, Icon } from '@/components'
import FeedHeaderBar from '@/core/feed/components/HeaderBar'
import useArrowNavigation from '@/core/feed/hooks/keyboard/useArrowNavigation'
import FeedSidebar from '@/core/feed/components/FeedSidebar'
import FeedHomepage from '@/core/feed/components/FeedHomepage'
import useFeedCollectionContent from '@/core/feed/hooks/useFeedCollectionContent'
import useFeedFolder from '@/core/feed/hooks/useFeedFolder'
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
            <Content style={{ padding: '0px 0px 32px 32px' }} fullHeight>
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
