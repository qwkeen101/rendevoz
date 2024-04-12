import { useRef } from 'react'
import useFeedState, { FeedStateAtom } from '@/core/components/feed/hooks/useFeedState'
import FeedContainer from '@/core/components/feed/components/FeedContainer'
import { Content, Icon } from '@/components'
import FeedHeaderBar from '@/core/components/feed/components/HeaderBar'
import useArrowNavigation from '@/core/components/feed/hooks/keyboard/useArrowNavigation'
import FeedSidebar from '@/core/components/feed/components/FeedSidebar'
import FeedHomepage from '@/core/components/feed/components/FeedHomepage'
import useFeedCollectionContent from '@/core/components/feed/hooks/useFeedCollectionContent'
import useFeedFolder from '@/core/components/feed/hooks/useFeedFolder'
import { TabTitle } from '@/core/rendevoz/components'
import { useTranslation } from 'react-i18next'
import { useSelectAtomValue } from '@/hooks'
import EditFeedItem from '@/core/components/feed/components/EditFeedItem'

// google news only have webpages
const GoogleNewsViewer = () => {
  const currentVisiblePage = useSelectAtomValue(FeedStateAtom, s => s.currentVisiblePage)
  const { t } = useTranslation()

  useFeedCollectionContent()
  const { renderModal } = useFeedFolder()
  const pageContainerRef = useRef<HTMLDivElement>(null)
  useArrowNavigation(pageContainerRef)
  return (
    <Content fullWidth tabIndex={0} fullHeight flex ref={pageContainerRef}>
      <FeedSidebar />
      <EditFeedItem />
      <TabTitle title={t('general.Feeds')} icon={<Icon name={'park-broadcast'} />} />
      {renderModal()}
      <Content fullHeight auto flex column>
        {currentVisiblePage === 'feeds' && (
          <>
            <FeedHeaderBar />
            <Content style={{ height: 0, flex: 1, width: '100%' }}>
              <FeedContainer pageContainer={pageContainerRef.current} />
            </Content>
          </>
        )}
        {currentVisiblePage === 'home' && <FeedHomepage />}
      </Content>
    </Content>
  )
}

export default GoogleNewsViewer
