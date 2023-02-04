import { CSSProperties, FC, memo } from 'react'
import * as material from 'material-colors'
import { Content } from '../../base'
import styles from './index.module.less'
import { css } from '@emotion/css'

interface ColorPickerProps {
  colors?: string[][]
  onPick: (color: string) => void
  backDefault?: boolean
  enableMore?: boolean
  isFont?: boolean
  enableDefault?: boolean
  disableLinear?: boolean
}
export const Colors: string[][] = [
  [material.red['900'], material.red['700'], material.red['500'], material.red['300'], material.red['100']],
  [material.pink['900'], material.pink['700'], material.pink['500'], material.pink['300'], material.pink['100']],
  [material.purple['900'], material.purple['700'], material.purple['500'], material.purple['300'], material.purple['100']],
  [
    material.deepPurple['900'],
    material.deepPurple['700'],
    material.deepPurple['500'],
    material.deepPurple['300'],
    material.deepPurple['100']
  ],
  [material.indigo['900'], material.indigo['700'], material.indigo['500'], material.indigo['300'], material.indigo['100']],
  [material.blue['900'], material.blue['700'], material.blue['500'], material.blue['300'], material.blue['100']],
  [material.lightBlue['900'], material.lightBlue['700'], material.lightBlue['500'], material.lightBlue['300'], material.lightBlue['100']],
  [material.cyan['900'], material.cyan['700'], material.cyan['500'], material.cyan['300'], material.cyan['100']],
  [material.teal['900'], material.teal['700'], material.teal['500'], material.teal['300'], material.teal['100']],
  ['#194D33', material.green['700'], material.green['500'], material.green['300'], material.green['100']],
  [
    material.lightGreen['900'],
    material.lightGreen['700'],
    material.lightGreen['500'],
    material.lightGreen['300'],
    material.lightGreen['100']
  ],
  [material.lime['900'], material.lime['700'], material.lime['500'], material.lime['300'], material.lime['100']],
  [material.yellow['900'], material.yellow['700'], material.yellow['500'], material.yellow['300'], material.yellow['100']],
  [material.amber['900'], material.amber['700'], material.amber['500'], material.amber['300'], material.amber['100']],
  [material.orange['900'], material.orange['700'], material.orange['500'], material.orange['300'], material.orange['100']],
  [
    material.deepOrange['900'],
    material.deepOrange['700'],
    material.deepOrange['500'],
    material.deepOrange['300'],
    material.deepOrange['100']
  ],
  [material.brown['900'], material.brown['700'], material.brown['500'], material.brown['300'], material.brown['100']],
  [material.blueGrey['900'], material.blueGrey['700'], material.blueGrey['500'], material.blueGrey['300'], material.blueGrey['100']],
  [
    'linear-gradient(to left, #aa4b6b, #6b6b83, #3b8d99)',
    'linear-gradient(to left, #c6ffdd, #fbd786, #f7797d)',
    'linear-gradient(to left, #0f2027, #203a43, #2c5364)',
    'linear-gradient(to left, #7f7fd5, #86a8e7, #91eae4)',
    'linear-gradient(to left, #12c2e9, #c471ed, #f64f59)',
    'linear-gradient(to left, #03001e, #7303c0, #ec38bc, #fdeff9)',
    'linear-gradient(to left, #b92b27, #1565c0)',
    'linear-gradient(to left, #373b44, #4286f4)',
    'linear-gradient(to right, #8e2de2, #4a00e0)',
    'linear-gradient(to left, #1f4037, #99f2c8)',
    'linear-gradient(to left, #654ea3, #eaafc8)',
    'linear-gradient(to left, #bdc3c7, #2c3e50)',
    'linear-gradient(to left, #ee9ca7, #ffdde1)',
    'linear-gradient(to left, #2193b0, #6dd5ed)',
    'linear-gradient(to left, #005aa7, #fffde4)',
    'linear-gradient(to right, #fffbd5, #b20a2c)',
    'linear-gradient(to left, #ffafbd, #ffc3a0)',
    'linear-gradient(to left, #dbe6f6, #c5796d)'
  ]
]
export const defaultFontColor = '#000000'
export const defaultBgColor = '#ffffff'
const ColorPicker: FC<ColorPickerProps> = ({
  onPick,
  colors = Colors,
  backDefault = false,
  enableMore = false,
  isFont = false,
  enableDefault = true,
  disableLinear
}) => {
  let displayColors = enableMore ? colors.map(i => (isFont ? i[2] : i[4])) : colors.flat(1)
  if (disableLinear) {
    displayColors = displayColors.filter(i => !i.startsWith('linear'))
  }
  if (enableDefault) {
    if (isFont) {
      displayColors.unshift(defaultFontColor)
    } else {
      displayColors.unshift(defaultBgColor)
    }
  }

  const renderItem = (color: string) => {
    const isLinearFont = isFont && color.startsWith('linear')
    const linearFont: CSSProperties = isLinearFont
      ? {
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }
      : {}
    return (
      <span
        key={color}
        onClick={e => {
          e.stopPropagation()
          onPick?.(color)
        }}
        className={css({
          width: 26,
          height: 26,
          padding: 2,
          borderRadius: 3,
          cursor: 'pointer',
          ':hover': {
            boxShadow: 'rgb(15 15 15 / 10%) 0px 0px 1px 1px'
          }
        })}
      >
        <div
          className={css({
            width: 22,
            height: 22,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 500,
            position: 'relative'
            // opacity: 0.8
          })}
          style={{
            background: isLinearFont ? color : isFont ? 'white' : color,
            color: isFont ? color : undefined,
            boxShadow: 'rgb(15 15 15 / 10%) 0px 0px 0px 1px inset',
            ...linearFont
          }}
        >
          {isFont && 'A'}
          {(color === defaultFontColor || color === defaultBgColor) && (
            <div
              className={css({
                background: 'rgba(239,68,68, 0.6)',
                transform: 'rotate(45deg)',
                position: 'absolute',
                transformOrigin: 'center',
                width: 2,
                height: '100%',
                marginLeft: -1,
                left: '50%'
              })}
            ></div>
          )}
        </div>
      </span>
    )
  }

  return (
    <Content flex column>
      <Content
        className={css({
          gridTemplateColumns: 'repeat(auto-fill, minmax(24px, 1fr))',
          display: 'grid !important',
          gridTemplateRows: 'auto auto',
          gridAutoRows: enableMore ? '0px' : undefined,
          overflow: 'hidden',
          padding: 1,
          gap: 4
        })}
      >
        {displayColors.map(i => renderItem(i))}
      </Content>
    </Content>
  )
}
export default memo(ColorPicker)
