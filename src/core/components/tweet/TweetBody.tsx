import { EnrichedTweet, TweetLink } from 'react-tweet'
import { css } from '@emotion/css'
import TweetCard from '@/core/components/tweet/TweetCard'

const clazz = css({
  fontSize: 'var(--tweet-body-font-size)',
  fontWeight: 'var(--tweet-body-font-weight)',
  lineHeight: 'var(--tweet-body-line-height)',
  margin: 'var(--tweet-body-margin)',
  overflowWrap: 'break-word',
  whiteSpace: 'pre-wrap'
})
export const TweetBody = ({ tweet, showCard = true }: { tweet: EnrichedTweet; showCard?: boolean }) => (
  <p className={clazz}>
    {tweet.entities.map((item, i) => {
      if (i === tweet.entities.length - 1 && item.type === 'url') {
        if (item.url === tweet?.card?.binding_values?.card_url?.string_value) {
          if (showCard) {
            return <TweetCard tweet={tweet} />
          }
          return null
        }
      }
      switch (item.type) {
        case 'hashtag':
        case 'mention':
        case 'url':
        case 'symbol':
          return (
            <TweetLink key={i} href={item.href}>
              {item.text}
            </TweetLink>
          )
        case 'media':
          // Media text is currently never displayed, some tweets however might have indices
          // that do match `display_text_range` so for those cases we ignore the content.
          return
        default:
          // We use `dangerouslySetInnerHTML` to preserve the text encoding.
          // https://github.com/vercel-labs/react-tweet/issues/29
          return <span key={i} dangerouslySetInnerHTML={{ __html: item.text }} />
      }
    })}
  </p>
)
