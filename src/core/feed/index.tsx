import { ObjectStore } from '@/api/stores'
import { useGlobalAtomValue } from '@/hooks'
import { Content } from '@/components'
import { useState } from 'react'
import GoogleNewsViewer from '@/core/feed/google/GoogleNewsViewer'

const FeedViewer = () => {
  const feedsAtom = ObjectStore('feed').objectMapAtom
  const allFeeds = useGlobalAtomValue(feedsAtom)
  ObjectStore('feed').getAll()

  return (
    <Content fullWidth fullHeight flex column>
      <GoogleNewsViewer />
    </Content>
  )
}

export default FeedViewer
