import { Icon, Tooltip, WithBorder } from '@/components'
import Actions from '@/core/Actions'
import { useRenderObject } from '@/core/database'
import { useGlobalAtomValue } from '@/hooks'
import { metaObjectsAtom } from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { selectAtom } from 'jotai/utils'
import { FC, useMemo } from 'react'
import { InlineMetaObjectElement } from '~/typings/editor/outerElements'
import { RenderElementProps } from '../../slate-react'

const clazzName = css({
  cursor: 'pointer',
  fontWeight: 500,
  textDecorationColor: 'rgba(13,30,142, 0.5)',
  ':hover': {
    textDecoration: 'underline'
  }
})
const InlineMetaElement: FC<RenderElementProps> = ({ element, children, attributes }) => {
  const { metaObject, renderWhole } = useRenderObject({
    metaObjectId: (element as InlineMetaObjectElement).originId
  })
  return (
    <span {...attributes} style={{ margin: '0 2px', position: 'relative', '--block-font-color': 'rgb(13, 30, 142)' }} className={clazzName}>
      <Tooltip
        contentTouchable
        content={
          <WithBorder style={{ padding: 10, maxWidth: 400 }}>
            {renderWhole({
              rowGap: 20,
              columnGap: 6,
              renderOptions: {
                renderFrom: true
              },
              titleOptions: {
                style: {
                  fontSize: 14
                }
              },
              descriptionOptions: {
                style: {
                  fontSize: 12
                }
              },
              fromOptions: {
                style: {
                  fontSize: 11
                },
                className: ClassName.ellipsisFont(1)
              }
            })}
          </WithBorder>
        }
        disableDefaultContent
      >
        <span
          onClick={() => {
            console.log('click')
            metaObject?.id && Actions.navigateToTargetObject(metaObject?.id)
          }}
        >
          {metaObject?.name}
        </span>
      </Tooltip>
      <Icon name="park-search" size={10} containerStyle={{ pointerEvents: 'none', display: 'inline-flex', verticalAlign: 'top' }} />
      {children}
    </span>
  )
}

export default InlineMetaElement
