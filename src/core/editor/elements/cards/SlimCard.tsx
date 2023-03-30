import { Content, Image } from '@/components/base'
import { css } from '@emotion/css'
import { FC, ReactNode } from 'react'
import { CustomElement } from '../../../../../typings/editor/types'

const SlimCard: FC<{
  pictureUrl?: string
  main?: ReactNode
  slateChildren?: ReactNode
  borderColor?: 'grey' | 'cream'
  element?: CustomElement
}> = ({ pictureUrl, main, slateChildren, element }) => {
  const linearBg = element && element.background && element.background.startsWith('linear')
  return (
    <Content
      contentEditable={false}
      flex
      style={{
        boxShadow: element?.background ? undefined : 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px'
      }}
      className={css({
        pointerEvents: 'auto',
        borderRadius: 6,
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
            position: 'relative',
            ':after': {
              position: 'absolute',
              inset: linearBg ? '-0.625em' : 0,
              filter: linearBg ? 'blur(0.5em)' : undefined,
              content: "''",
              transform: linearBg ? 'translateY(85%)' : undefined,
              backgroundImage: linearBg
                ? 'var(--block-linear-bg)'
                : 'linear-gradient(transparent 80%, rgba(var(--block-rgb-bg, 255 255 255)) 100%)'
            },
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
