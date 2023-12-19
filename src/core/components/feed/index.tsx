import { Content } from '@/components'
import GoogleNewsViewer from '@/core/components/feed/google/GoogleNewsViewer'

const FeedViewer = () => {
  return (
    <Content fullWidth fullHeight flex column>
      <GoogleNewsViewer />
    </Content>
  )
}

export default FeedViewer
