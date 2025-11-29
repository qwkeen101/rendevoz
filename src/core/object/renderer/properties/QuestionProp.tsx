import { CSSProperties, memo, useEffect } from 'react'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { AnimatePopover, Button, Content, Icon, WithBorder } from '@/components'
import { Colors } from '@/consts'
import { PopupWrapper } from '@/core/components/group/components'
import { ObjectStore } from '@/api/stores'
import QuestionCard from '@/core/ai/components/question/QuestionCard'

export default memo(
  ({
    value,
    style,
    onChange,
    className,
    optionStyle
  }: {
    value?: number
    style?: CSSProperties
    className?: string
    optionStyle?: CSSProperties
    onChange?: (value: number) => void
  }) => {
    const question = ObjectStore('question').useValue(value)
    useEffect(() => {
      if (!value) {
        ObjectStore('question')
          .addOne({})
          .then(res => {
            onChange?.(res.id)
          })
      }
    }, [])
    const { openPopover, closePopover, renderPopover } = usePopoverCell()
    return (
      <>
        <Content
          flex
          className={className}
          role={'prop-container'}
          gap={'6px 8px'}
          style={{
            width: '100%',
            flexWrap: 'inherit',
            ...style
          }}
          onClick={e => {
            const p = e.currentTarget.parentElement
            if (p) {
              openPopover(p)
            }
          }}
        >
          <div style={optionStyle}>{question?.name}</div>
        </Content>
        {renderPopover(box => (
          <PopupWrapper box={{ ...box, width: Math.max(box.width, 320) }}>
            {value && (
              <QuestionCard
                display={{
                  more: false
                }}
                id={value}
              />
            )}
          </PopupWrapper>
        ))}
      </>
    )
  }
)
