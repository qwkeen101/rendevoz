import FontSize from '@/consts/font'
import getEmoji from '@/utils/emoji'
import { FC, useMemo } from 'react'
import { RenderElementProps } from 'slate-react'
import { EmojiElement } from '~/typings'

const Emoji: FC<RenderElementProps> = ({ element, children, attributes }) => {
  const emojiEle = element as EmojiElement
  const emoji = useMemo(() => (emojiEle.name ? getEmoji(emojiEle.name) : undefined), [emojiEle.name])

  const InlineChromiumBugfix = () => (
    <span contentEditable={false} style={{ fontSize: 0 }}>
      ${String.fromCodePoint(160) /* Non-breaking space */}
    </span>
  )
  return (
    <span {...attributes} style={{ margin: '0 0.1em', fontSize: element?.fontSize ? element.fontSize : FontSize['16px'] }}>
      <InlineChromiumBugfix />
      {emoji && (
        <img
          src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
          style={{
            width: '1em',
            height: '1em',
            backgroundImage: `url(${emoji.imageSrc})`,
            backgroundPositionX: `${(emoji.x * 100) / 60}%`,
            backgroundPositionY: `${(emoji.y * 100) / 60}%`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '6100% 6100%',
            verticalAlign: '-0.1em'
          }}
        />
      )}
      {children}
      <InlineChromiumBugfix />
    </span>
  )
}

export default Emoji
