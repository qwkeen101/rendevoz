import { FC, memo } from 'react'
import * as material from 'material-colors'
import { Content } from '../../base'
import { css } from '@emotion/css'
import FontSize from '@/consts/font'
import { default as ConstColors } from '@/consts/colors'
interface ColorPickerProps {
  colors?: string[][]
  onPick: (color: string) => void
  enableMore?: boolean
  isFont?: boolean
  enableDefault?: boolean
  disableLinear?: boolean
  text?: string
}
export const Colors: string[][] = [
  [material.red['900'], material.red['700'], material.red['500'], material.red['300'], material.red['200']],
  [material.pink['900'], material.pink['700'], material.pink['500'], material.pink['300'], material.pink['200']],
  [material.purple['900'], material.purple['700'], material.purple['500'], material.purple['300'], material.purple['200']],
  [
    material.deepPurple['900'],
    material.deepPurple['700'],
    material.deepPurple['500'],
    material.deepPurple['300'],
    material.deepPurple['200']
  ],
  [material.indigo['900'], material.indigo['700'], material.indigo['500'], material.indigo['300'], material.indigo['200']],
  [material.blue['900'], material.blue['700'], material.blue['500'], material.blue['300'], material.blue['200']],
  [material.lightBlue['900'], material.lightBlue['700'], material.lightBlue['500'], material.lightBlue['300'], material.lightBlue['200']],
  [material.cyan['900'], material.cyan['700'], material.cyan['500'], material.cyan['300'], material.cyan['200']],
  [material.teal['900'], material.teal['700'], material.teal['500'], material.teal['300'], material.teal['200']],
  ['#194D33', material.green['700'], material.green['500'], material.green['300'], material.green['200']],
  [
    material.lightGreen['900'],
    material.lightGreen['700'],
    material.lightGreen['500'],
    material.lightGreen['300'],
    material.lightGreen['200']
  ],
  [material.lime['900'], material.lime['700'], material.lime['500'], material.lime['300'], material.lime['200']],
  [material.yellow['900'], material.yellow['700'], material.yellow['500'], material.yellow['300'], material.yellow['200']],
  [material.amber['900'], material.amber['700'], material.amber['500'], material.amber['300'], material.amber['200']],
  [material.orange['900'], material.orange['700'], material.orange['500'], material.orange['300'], material.orange['200']],
  [
    material.deepOrange['900'],
    material.deepOrange['700'],
    material.deepOrange['500'],
    material.deepOrange['300'],
    material.deepOrange['200']
  ],
  [material.brown['900'], material.brown['700'], material.brown['500'], material.brown['300'], material.brown['200']],
  [material.blueGrey['900'], material.blueGrey['700'], material.blueGrey['500'], material.blueGrey['300'], material.blueGrey['200']]
]
export const defaultFontColor = ConstColors.Font.Blank
export const defaultBgColor = ConstColors.Background.Blank
export const DEFAULT_FONT_COLORS = Colors.map(i => i[2])
export const DEFAULT_BACKGROUND_COLORS = Colors.map(i => i[4])
export const DEFAULT_DARKEN_BACKGROUND_COLORS = Colors.map(i => i[3])
const ColorPicker: FC<ColorPickerProps> = ({
  onPick,
  colors = Colors,
  enableMore = false,
  isFont = false,
  enableDefault = true,
  disableLinear,
  text
}) => {
  let displayColors = enableMore ? (isFont ? [...DEFAULT_FONT_COLORS] : [...DEFAULT_BACKGROUND_COLORS]) : colors.flat(1)
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
            boxShadow: '0 0 0 1px var(--border-background)'
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
            fontSize: FontSize['16px'],
            fontWeight: 500,
            position: 'relative'
            // opacity: 0.8
          })}
          style={{
            background: isFont
              ? 'white'
              : color === defaultFontColor || color === defaultBgColor
              ? ConstColors.Background.Secondary
              : enableMore === false
              ? color
              : ConstColors.getAdaptColor(color),
            color: isFont ? color : undefined,
            boxShadow: 'rgb(15 15 15 / 10%) 0px 0px 0px 1px inset'
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
      {text && (
        <div
          style={{
            marginBottom: 10
          }}
        >
          {text}
        </div>
      )}
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
        style={{
          height: !enableMore ? 'auto' : 56
        }}
      >
        {displayColors.map(i => renderItem(i))}
      </Content>
    </Content>
  )
}
export default memo(ColorPicker)
