import { Content, Image } from '@/components/base'
import { useTheme } from '@/hooks'
import { css } from '@emotion/css'
import { FC, ReactNode } from 'react'
import useCardBorder from './useBorder'

const WideCard: FC<{
  pictureUrl?: string
  main?: ReactNode
  slateChildren?: ReactNode
  borderColor?: 'grey' | 'cream'
}> = ({ borderColor = 'cream', main, slateChildren, pictureUrl }) => {
  const border = useCardBorder(borderColor)
  return (
    <Content
      contentEditable={false}
      flex
      className={css({
        border: `1px solid ${border}`,
        borderRadius: 8,
        overflow: 'hidden'
      })}
    >
      <Content
        flex
        className={css({
          padding: '8px 16px',
          flex: 1,
          height: 'fit-content',
          marginRight: pictureUrl ? 'clamp(0px, 200px, calc(100% - 450px))' : 0
        })}
      >
        {main}
      </Content>
      {pictureUrl && (
        <Image
          ratio={1.33}
          width="clamp(0px, 200px, calc(100% - 450px))"
          className={css({
            position: 'absolute',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            right: 0,
            '> div': {
              height: '100%'
            }
          })}
          src={pictureUrl}
        />
      )}
      {slateChildren}
    </Content>
  )
}
export default WideCard
