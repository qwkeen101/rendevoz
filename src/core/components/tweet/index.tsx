import { ObjectStore } from '@/api/stores'
import { CSSProperties, memo, useEffect } from 'react'
import { getTweet } from 'react-tweet/api'
import TweetRenderer from '@/core/components/tweet/TweetRenderer'

export type TweetProps = {
  styles?: {
    bodyFontSize?: string
    titleFontSize?: string
    infoFontSize?: string
    border?: string
    imageSize?: number
    bodyStyles?: CSSProperties
  }
  layout?: {
    showCard?: boolean
    showHeader?: boolean
    showBorder?: boolean
  }
}

export default memo(
  ({
    id,
    styles,
    layout
  }: {
    id: number
  } & TweetProps) => {
    const tweet = ObjectStore('tweet').useValue(id)
    useEffect(() => {
      if (tweet?.url && !tweet.tweet) {
        const tweetId = tweet.url.split('/').pop()
        if (tweetId && !Number.isNaN(Number(tweetId))) {
          getTweet(tweetId).then(w => {
            ObjectStore('tweet').updateOne({ id: id, tweet: w })
          })
        }
      }
    }, [tweet])
    return <TweetRenderer styles={styles} layout={layout} tweetId={tweet?.tweetId} tweet={tweet?.tweet} />
  }
)
