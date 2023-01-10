import { ColorPicker, Content, WithBorder } from '@/components'
import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'

type PickColorFunc = (color: string) => void
const BlockColorPicker = ({
  onPickFontColor,
  onPickBackgroundColor,
  showBg = true,
  showFont = true,
  fontBackDefault = true,
  bgBackDefault = true
}: {
  onPickFontColor: PickColorFunc
  onPickBackgroundColor: PickColorFunc
  showBg?: boolean
  showFont?: boolean
  fontBackDefault?: boolean
  bgBackDefault?: boolean
}) => {
  const [showMoreColor, toggleShowMoreFontColor] = useToggle(false)
  const [showMoreBackground, toggleShowMoreBackground] = useToggle(false)
  return (
    <WithBorder
      className={css({
        padding: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        '> div': {
          width: 275
        }
      })}
    >
      {showFont && (
        <>
          <Content flex alignItems="center" justifyContent="space-between" className={ClassName.description()}>
            <span>Font color</span>
            <span onClick={toggleShowMoreFontColor} className={ClassName.flatButton(3, '0px 3px')}>
              {showMoreColor ? 'Show less' : 'Show more'}
            </span>
          </Content>
          <ColorPicker enableDefault={fontBackDefault} isFont enableMore={!showMoreColor} onPick={onPickFontColor} />
        </>
      )}
      {showBg && (
        <>
          <Content flex alignItems="center" justifyContent="space-between" className={ClassName.description()}>
            <span>Background color</span>
            <span onClick={toggleShowMoreBackground} className={ClassName.flatButton(3, '0px 3px')}>
              {showMoreBackground ? 'Show less' : 'Show more'}
            </span>
          </Content>
          <ColorPicker enableDefault={bgBackDefault} enableMore={!showMoreBackground} onPick={onPickBackgroundColor} />
        </>
      )}
    </WithBorder>
  )
}

export default BlockColorPicker
