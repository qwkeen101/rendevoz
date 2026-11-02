// 9 colors, with default as first
import { memo } from 'react'
import material from 'material-colors'
import { WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { Colors } from '../consts'
import tinycolor from 'tinycolor2'

const textColors = [
  material.grey[500],
  material.brown[300],
  material.orange[500],
  material.amber[500],
  material.lightGreen[500],
  material.blue[500],
  material.purple[400],
  material.pink[300],
  material.red[500]
]
const bgColors = [
  material.grey[50],
  material.brown[200],
  material.orange[200],
  material.amber[200],
  material.lightGreen[300],
  material.blue[200],
  material.purple[200],
  material.pink[200],
  material.red[300]
]
export default memo(
  ({
    color,
    background,
    onBackgroundChange,
    onColorChange,
    onClick
  }: {
    onClick?: VoidFunction
    color?: string
    background?: string
    onColorChange: (color: string | undefined) => void
    onBackgroundChange: (bg: string | undefined) => void
  }) => {
    const { t } = useTranslation()
    return (
      <WithBorder className={'p-3'} onClick={onClick}>
        <div className={'menu-sub-title mb-2'}>{t('editor.Text color')}</div>
        <div className={'grid grid-cols-5 gap-2.5'}>
          <div
            style={{
              boxShadow:
                color === undefined
                  ? `rgb(from var(--font-primary) r g b / 0.4) 0 0 0 2px inset`
                  : '0 0 0 1px var(--border-background) inset',
              fontSize: 16,
              width: 26,
              height: 26,
              lineHeight: 1.2,
              borderRadius: 6
            }}
            onClick={() => onColorChange(undefined)}
            className={'font-medium cursor-pointer flex items-center justify-center'}
          >
            A
          </div>
          {textColors.map(i => (
            <div
              style={{
                color: i,
                boxShadow: i === color ? `rgb(from ${i} r g b / 0.4) 0 0 0 2px inset` : '0 0 0 1px var(--border-background) inset',
                fontSize: 16,
                width: 26,
                height: 26,
                lineHeight: 1.2,
                borderRadius: 6
              }}
              className={'font-medium cursor-pointer flex items-center justify-center'}
              key={i}
              onClick={() => onColorChange(i)}
            >
              A
            </div>
          ))}
        </div>
        <div className={'menu-sub-title mb-2 mt-3'}>{t('editor.Background color')}</div>
        <div className={'grid grid-cols-5 gap-2.5'}>
          <div
            style={{
              boxShadow: undefined === background ? `0 0 0 2px var(--border-background) inset` : '0 0 0 1px var(--border-background) inset',
              fontSize: 16,
              width: 26,
              height: 26,
              borderRadius: 6
            }}
            className={'cursor-pointer'}
            onClick={() => onBackgroundChange(undefined)}
          ></div>
          {bgColors.map(i => (
            <div
              style={{
                background: `rgb(from ${Colors.getAdaptColor(i)} r g b / var(--editor-bg-opacity))`,
                boxShadow:
                  i === background
                    ? `rgb(from ${tinycolor(Colors.getAdaptColor(i)).toRgbString()} r g b) 0 0 0 2px inset`
                    : `rgb(from ${Colors.getAdaptColor(i)} r g b / 0.8) 0 0 0 1px inset`,
                fontSize: 16,
                width: 26,
                height: 26,
                borderRadius: 6
              }}
              className={'cursor-pointer'}
              key={i}
              onClick={() => onBackgroundChange(i)}
            ></div>
          ))}
        </div>
      </WithBorder>
    )
  }
)
