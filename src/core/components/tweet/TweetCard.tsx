import { EnrichedTweet } from 'react-tweet'
import { Content } from '@/components'
import { ClassName } from 'rendevoz'
import { memo } from 'react'
import { useMeasure } from 'react-use'

export default memo(
  ({
    tweet
  }: {
    tweet: {
      card?: {
        binding_values: {
          title: {
            string_value: string
          }
          card_url: {
            string_value: string
          }
          domain: {
            string_value: string
          }
          description: {
            string_value: string
          }
          photo_image_full_size_original: {
            image_value: {
              alt: string
              height: number
              url: string
              width: number
            }
          }
        }
      }
    }
  }) => {
    if (tweet.card && tweet.card.binding_values?.title?.string_value) {
      const [ref, { width }] = useMeasure()
      const c = tweet.card
      const imgV = c.binding_values.photo_image_full_size_original?.image_value
      const vs = c.binding_values
      return (
        <a target={'_blank'} href={c.binding_values.card_url.string_value}>
          <div
            ref={ref}
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              marginTop: 11,
              cursor: 'pointer',
              border: '1px solid var(--border-background)',
              padding: 0,
              marginBottom: 10
            }}
            className={ClassName.flatButton()}
          >
            {imgV && (
              <div style={{ width: '100%', paddingBottom: '52.35%', position: 'relative', overflow: 'hidden' }}>
                <img
                  style={{
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    position: 'absolute',
                    inset: 0,
                    borderBottom: 'var(--tweet-border)'
                  }}
                  src={imgV.url}
                />
              </div>
            )}
            <Content flex column gap={2} style={{ padding: 12, lineHeight: 1.4 }}>
              {vs.domain?.string_value && (
                <div style={{ fontSize: 14, color: 'var(--tweet-font-color-secondary)' }}>{c.binding_values.domain.string_value}</div>
              )}
              {vs.title?.string_value && (
                <div className={width >= 420 ? 'ellipsis-font-1' : undefined} style={{ fontSize: 14, color: 'var(--font-primary)' }}>
                  {c.binding_values.title.string_value}
                </div>
              )}
              {vs.description?.string_value && width >= 420 && (
                <div className={'ellipsis-font-2'} style={{ fontSize: 14, color: 'var(--tweet-font-color-secondary)' }}>
                  {c.binding_values.description.string_value}
                </div>
              )}
            </Content>
          </div>
        </a>
      )
    }
    return null
  }
)
