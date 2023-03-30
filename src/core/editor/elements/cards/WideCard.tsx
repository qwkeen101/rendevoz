import { Content, Image } from '@/components/base'
import { useTheme } from '@/hooks'
import { css } from '@emotion/css'
import { FC, ReactNode } from 'react'
import { CustomElement } from '../../../../../typings/editor/types'
import useCardBorder from './useBorder'

const WideCard: FC<{
  pictureUrl?: string
  main?: ReactNode
  slateChildren?: ReactNode
  borderColor?: 'grey' | 'cream'
  element?: CustomElement
}> = ({ borderColor = 'cream', main, slateChildren, pictureUrl, element }) => {
  return (
    <Content
      contentEditable={false}
      flex
      style={{
        boxShadow: element?.background ? undefined : 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px'
      }}
      className={css({
        borderRadius: 6,
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
