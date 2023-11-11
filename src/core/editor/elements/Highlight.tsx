import { AnimatePopover, Content, WithBorder } from '@/components'
import { RenderElementProps } from 'slate-react'
import { CustomElement } from '~/typings'
import getEmoji from '@/utils/emoji'
import { useMemo } from 'react'
import EmojiPicker from '@/components/picker/emojiPicker'
import { ReactEditor, useSlateStatic } from '../slate-react'
import { Transforms } from 'slate'
import ClassName from '@/styles/classNames'
import tinycolor from 'tinycolor2'

const HighlightBlock = ({ element, children }: RenderElementProps) => {
  const highlightBlockEle = element as CustomElement & {
    type: 'highlight-block'
  }
  const emoji = useMemo(() => getEmoji(highlightBlockEle.icon || 'blush'), [highlightBlockEle.icon])
  const editor = useSlateStatic()
  const alphaBorder = useMemo(() => {
    if (highlightBlockEle.borderColor) {
      const { borderColor } = highlightBlockEle
      const color = new tinycolor(borderColor)
      const hex = color.setAlpha(0.05).toHex8()
      return hex
    }
    return ''
  }, [highlightBlockEle.borderColor])
  return (
    <Content
      style={{
        padding: 12,
        border: highlightBlockEle.borderColor ? `2px solid ${highlightBlockEle.borderColor}` : '2px solid transparent',
        backgroundColor: 'rgba(var(--block-rgb-bg, 241, 242, 228), 0.6)',
        backgroundImage: 'var(--block-linear-bg)',
        borderRadius: 8,
        margin: highlightBlockEle.borderColor ? 2 : 0,
        boxShadow: highlightBlockEle.borderColor ? `0 0 0 4px #${alphaBorder}` : undefined
      }}
      flex
      gap={12}
    >
      <AnimatePopover
        positions={['bottom', 'top']}
        padding={10}
        content={
          <WithBorder style={{ width: 400, height: 300 }}>
            <EmojiPicker
              onPick={v =>
                Transforms.setNodes(
                  editor,
                  {
                    icon: v
                  },
                  {
                    at: ReactEditor.findPath(editor, element)
                  }
                )
              }
            />
          </WithBorder>
        }
      >
        <div contentEditable={false} className={ClassName.circleButton(4, 4)} style={{ lineHeight: 1, height: 'fit-content' }}>
          <img
            src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
            style={{
              width: '32px',
              height: '32px',
              backgroundImage: `url(${emoji?.imageSrc})`,
              backgroundPositionX: `${((emoji?.x ?? 0) * 100) / 60}%`,
              backgroundPositionY: `${((emoji?.y ?? 0) * 100) / 60}%`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: '6100% 6100%',
              verticalAlign: '-0.1em'
            }}
          />
        </div>
      </AnimatePopover>
      <div>{children}</div>
    </Content>
  )
}

export default HighlightBlock
