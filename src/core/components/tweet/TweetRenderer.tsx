import { useEffect, useState, memo } from 'react'
import { getTweet, Tweet } from 'react-tweet/api'
import { TweetContainer, TweetHeader, TweetInReplyTo, TweetInfo, QuotedTweet, TweetMedia, enrichTweet } from 'react-tweet'
import { TweetBody } from './TweetBody'
import { css } from '@emotion/css'
import { Colors } from '@/consts'
import { useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'
import { TweetProps } from '@/core/components/tweet/index'
export default memo(({ tweetId, tweet: outTweet, styles, layout }: { tweetId?: string; tweet?: any } & TweetProps) => {
  const darkMode = useSelectGlobalAtomValue(SettingAtom, s => s.general.darkMode) === true
  const [tweet, setTweet] = useState<Tweet>()
  useEffect(() => {
    if (outTweet) {
      setTweet(outTweet)
    } else if (tweetId) {
      getTweet(tweetId).then(t => setTweet(t))
    }
  }, [tweetId, outTweet])
  if (tweet) {
    const t = enrichTweet(structuredClone(tweet))
    return (
      <div
        data-theme={darkMode ? 'dark' : 'light'}
        style={{ width: 'min(100%, 550px)', margin: 'auto', maxWidth: '100%', minWidth: 'min(300px, 100%)', ...styles?.bodyStyles }}
      >
        <TweetContainer
          className={css({
            ':hover': {
              backgroundColor: 'transparent'
            },
            '> article': {
              '> div': {
                ':first-child': {
                  paddingBottom: 4
                },
                '&[class*="root"]': {
                  marginBottom: 10
                }
              }
            },
            '[class*="authorFollow"],[class*="infoLink"]': {
              display: 'none'
            },
            '[class*="avatar"]': {
              width: styles?.imageSize ?? 40,
              height: styles?.imageSize ?? 40
            },
            border: layout?.showBorder === false ? 'none' : undefined,
            margin: 0,
            '--tweet-header-font-size': styles?.titleFontSize ?? '15px',
            '--tweet-border': styles?.border ?? '1px solid var(--border-background)',
            '--tweet-body-margin': '0px 0px 6px 0px',
            '--tweet-body-font-size': styles?.bodyFontSize ?? '17px',
            '--tweet-info-font-size': styles?.infoFontSize ?? '14px',
            '--tweet-bg-color': 'transparent',
            '--tweet-font-color-secondary': 'var(--font-secondary)',
            '--tweet-font-color': 'var(--font-primary)',
            '--tweet-bg-color-hover': Colors.Background.ButtonHover
          })}
        >
          <TweetHeader
            tweet={t}
            components={{
              AvatarImg: props => (
                <img width={styles?.imageSize ?? 40} height={styles?.imageSize ?? 40} src={t.user.profile_image_url_https} />
              )
            }}
          />
          {tweet.in_reply_to_status_id_str && <TweetInReplyTo tweet={t} />}
          <TweetBody showCard={layout?.showCard} tweet={t} />
          {tweet.mediaDetails?.length ? <TweetMedia tweet={t} components={{}} /> : null}
          {tweet.quoted_tweet && <QuotedTweet tweet={t.quoted_tweet} />}
          <TweetInfo tweet={t} />
          {/*<TweetActions tweet={t} />*/}
        </TweetContainer>
      </div>
    )
  }
  return null
})
