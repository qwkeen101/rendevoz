import { PopoverProps } from 'react-tiny-popover'
import { useMemo } from 'react'
import { getEmoji } from '@/utils'
import { AnimatePopover, WithBorder } from '@/components/base'
import EmojiPicker from '@/components/picker/emojiPicker'
import { Size } from '~/typings'
import { ClassName } from 'rendevoz'

type Props = {
  showPicker?: boolean
  positions?: PopoverProps['positions']
  align?: PopoverProps['align']
  emoji?: string
  onChange?: (newEmoji: string) => void
  size?: Size
}

const EmojiWithPicker = ({
  showPicker,
  onChange,
  positions = ['bottom', 'right', 'left', 'top'],
  align,
  emoji,
  size = {
    width: '1em',
    height: '1em'
  }
}: Props) => {
  const data = useMemo(() => {
    if (emoji) {
      const data = getEmoji(emoji)
      return data
    }
  }, [emoji])

  if (!data) return null

  const renderImg = () => {
    return (
      <div className={ClassName.flatButton(4, '6px')} style={{ lineHeight: 1 }}>
        <img
          src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
          style={{
            width: size.width,
            height: size.height,
            backgroundImage: `url(${data.imageSrc})`,
            backgroundPositionX: `${(data.x * 100) / 60}%`,
            backgroundPositionY: `${(data.y * 100) / 60}%`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '6100% 6100%',
            verticalAlign: '-0.1em',
            pointerEvents: 'none'
          }}
        />
      </div>
    )
  }
  if (showPicker) {
    return (
      <AnimatePopover
        align={align}
        padding={10}
        positions={positions}
        content={
          <WithBorder>
            <EmojiPicker onPick={s => onChange?.(s)} />
          </WithBorder>
        }
      >
        {renderImg()}
      </AnimatePopover>
    )
  } else {
    return renderImg()
  }
}

export default EmojiWithPicker
