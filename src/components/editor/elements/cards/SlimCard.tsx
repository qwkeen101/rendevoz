import { Content, Image } from '@/components/base'
import { css } from '@emotion/css'
import { FC, ReactNode } from 'react'
import useCardBorder from './useBorder'

const SlimCard: FC<{
  pictureUrl?: string
  main?: ReactNode
  slateChildren?: ReactNode
  borderColor?: 'grey' | 'cream'
}> = ({ pictureUrl, main, slateChildren, borderColor = 'cream' }) => {
  const border = useCardBorder(borderColor)

  return (
    <Content
      contentEditable={false}
      flex
      className={css({
        pointerEvents: 'auto',
        border: `1px solid ${border}`,
        borderRadius: 8,
        overflow: 'hidden',
        maxWidth: '100%',
        width: '100%',
        '@media (min-width: 768px)': {
          maxWidth: '21rem'
        }
      })}
      column
    >
      {pictureUrl && (
        <Image
          width="100%"
          src={pictureUrl}
          className={css({
            height: '200px',
            overflow: 'hidden',
            '> div': {
              height: '100%'
            }
          })}
        />
      )}
      <Content
        flex
        auto
        className={css({
          padding: '8px 16px',
          flex: 1,
          height: 'fit-content'
        })}
      >
        {main}
      </Content>
      {slateChildren}
    </Content>
  )
}
export default SlimCard
