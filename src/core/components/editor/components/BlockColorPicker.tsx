import { ColorPicker, Content, WithBorder } from '@/components'
import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'
import { CSSProperties } from 'react'

type PickColorFunc = (color: string) => void
const BlockColorPicker = ({
  onPickFontColor,
  onPickBackgroundColor,
  showBg = true,
  showFont = true,
  fontBackDefault = true,
  bgBackDefault = true,
  borderBackDefault = true,
  showMoreBg,
  showMoreFont,
  showMoreBgOption,
  showMoreFontOption,
  showBorder,
  onPickBorderColor,
  style
}: {
  onPickFontColor?: PickColorFunc
  onPickBackgroundColor?: PickColorFunc
  onPickBorderColor?: PickColorFunc
  showBg?: boolean
  showFont?: boolean
  showBorder?: boolean
  fontBackDefault?: boolean
  bgBackDefault?: boolean
  borderBackDefault?: boolean
  showMoreBg?: boolean
  style?: CSSProperties
  showMoreFont?: boolean
  showMoreFontOption?: boolean
  showMoreBgOption?: boolean
}) => {
  const [showMoreColor, toggleShowMoreFontColor] = useToggle(false)
  const [showMoreBackground, toggleShowMoreBackground] = useToggle(false)
  const { t } = useTranslation()
  return (
    <WithBorder
      className={css({
        padding: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        '> div': {
          width: 275
        }
      })}
      style={{
        ...style
      }}
    >
      {showFont && (
        <Content flex column gap={3}>
          <Content flex alignItems="center" justifyContent="space-between" className={'font-size-12 transparent-font'}>
            <span>{t('editor.font color')}</span>
            {showMoreFontOption && (
              <span onClick={toggleShowMoreFontColor} className={ClassName.flatButton(3, '0px 3px')}>
                {showMoreColor ? t('editor.show less') : t('editor.show more')}
              </span>
            )}
          </Content>
          <ColorPicker enableDefault={fontBackDefault} isFont showLess={!showMoreColor && !showMoreFont} onPick={onPickFontColor} />
        </Content>
      )}
      {showBorder && (
        <Content flex column gap={3}>
          <div className={'font-size-12 transparent-font'}>{t('editor.border color')}</div>
          <ColorPicker enableDefault={borderBackDefault} showLess={true} onPick={onPickBorderColor} />
        </Content>
      )}
      {showBg && (
        <Content flex column gap={3}>
          <Content flex alignItems="center" justifyContent="space-between" className={'font-size-12 transparent-font'}>
            <span>{t('editor.background color')}</span>
            {showMoreBgOption && (
              <span onClick={toggleShowMoreBackground} className={ClassName.flatButton(3, '0px 3px')}>
                {showMoreBackground ? t('editor.show less') : t('editor.show more')}
              </span>
            )}
          </Content>
          <ColorPicker enableDefault={bgBackDefault} showLess={!showMoreBackground && !showMoreBg} onPick={onPickBackgroundColor} />
        </Content>
      )}
    </WithBorder>
  )
}

export default BlockColorPicker
