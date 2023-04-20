import { Icon, Tooltip, WithBorder } from '@/components'
import Actions from '@/core/Actions'
import { TypeToTypeName, useRenderObject } from '@/core/database'
import { useGlobalAtomValue } from '@/hooks'
import { metaObjectsAtom } from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { selectAtom } from 'jotai/utils'
import { FC, useMemo } from 'react'
import { InlineMetaObjectElement } from '~/typings/editor/outerElements'
import { RenderElementProps } from '../../slate-react'
import { useTranslation } from 'react-i18next'
import Colors from '@/consts/colors'
import tinycolor from 'tinycolor2'

const clazzName = css([
  {
    cursor: 'pointer',
    fontWeight: 500,
    ':hover': {
      textDecoration: 'underline'
    }
  },
  ClassName.ellipsisFont(2)
])
const InlineMetaElement: FC<RenderElementProps> = ({ element, children, attributes }) => {
  const { metaObject, renderWhole } = useRenderObject({
    metaObjectId: (element as InlineMetaObjectElement).originId
  })
  const { t } = useTranslation()

  const { circleColor, innerColor } = useMemo(() => {
    if (!metaObject?.color) {
      return {
        circleColor: '#6d6d6d',
        innerColor: Colors.Background.Light
      }
    } else {
      const color = tinycolor(metaObject.color)
      const defaultColor = color.lighten(20).setAlpha(0.7).toRgbString()
      const darken = tinycolor(metaObject.color).setAlpha(0.5)
      return {
        innerColor: `${darken.toRgbString()}`,
        circleColor: defaultColor
      }
    }
  }, [metaObject?.color])
  return (
    <span {...attributes} data-meta-id={element.id} style={{ margin: '0 6px', position: 'relative' }}>
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
        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'baseline' }}>
          <div
            style={{
              borderRadius: '50%',
              width: '1em',
              height: '1em',
              background: innerColor,
              border: `0.3em solid ${circleColor}`,
              margin: 'auto',
              flexShrink: 0,
              padding: 3
            }}
          ></div>
          <span
            className={clazzName}
            data-meta
            onClick={() => {
              metaObject?.id && Actions.navigateToTargetObject(metaObject?.id)
            }}
            style={{
              color: metaObject?.color
            }}
          >
            {metaObject?.name || 'Deleted Object'}
          </span>
          <div
            style={{
              textTransform: 'capitalize',
              pointerEvents: 'none',
              fontSize: 10,
              whiteSpace: 'nowrap',
              lineHeight: 1,
              padding: '3px 8px',
              margin: 'auto'
            }}
            className={ClassName.objectTag}
          >
            {t(`general.${TypeToTypeName[metaObject?.type || 'normal']}`)}
          </div>
        </div>
      </Tooltip>
      {children}
    </span>
  )
}

export default InlineMetaElement
