import { AnimatePopover, Content, WithBorder } from '@/components'
import { RenderElementProps } from 'slate-react'
import { CustomElement } from '~/typings'
import getEmoji from '../utils/emoji'
import { useMemo } from 'react'
import EmojiPicker from '@/components/picker/emojiPicker'
import { ReactEditor, useSlateStatic } from '../slate-react'
import { Transforms } from 'slate'
import tinycolor from 'tinycolor2'
import { Colors } from '../consts'

const HighlightBlock = ({ element, children }: RenderElementProps) => {
  const highlightBlockEle = element as CustomElement & {
    type: 'highlight-block'
  }
  const emoji = useMemo(() => getEmoji(highlightBlockEle.icon || 'bulb'), [highlightBlockEle.icon])
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
    <div
      className={'bg-third flex'}
      style={{
        padding: '0.75em',
        border: highlightBlockEle.borderColor ? `2px solid ${highlightBlockEle.borderColor}` : '2px solid transparent',
        backgroundColor: element.background ? Colors.getAlphaColor(Colors.getAdaptColor(element.background), 0.6) : undefined,
        borderRadius: '0.5em',
        gap: '1em',
        margin: highlightBlockEle.borderColor ? 2 : 0,
        boxShadow: highlightBlockEle.borderColor ? `0 0 0 4px #${alphaBorder}` : undefined
      }}
    >
      <AnimatePopover
        positions={['bottom', 'top']}
        padding={10}
        content={setV => (
          <WithBorder style={{ width: 400, height: 300 }}>
            <EmojiPicker
              onPick={v => {
                Transforms.setNodes(
                  editor,
                  {
                    icon: v
                  },
                  {
                    at: ReactEditor.findPath(editor, element)
                  }
                )
                setV(false)
              }}
            />
          </WithBorder>
        )}
      >
        <div contentEditable={false} className={'square-button'} style={{ lineHeight: 1, flexShrink: 0, height: 'fit-content' }}>
          <img
            src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
            style={{
              width: '2em',
              height: '2em',
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
      <div className={'flex-1'}>{children}</div>
    </div>
  )
}

export default HighlightBlock
