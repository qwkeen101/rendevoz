import { MetaStore } from '@/api/stores'
import { AI_QUESTION_PROP_ID } from '@/api/stores/meta/meta.store'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { PopupWrapper } from '@/core/components/group/components'
import { CSSProperties } from 'react'
import { Content } from '@/components'
import QuestionCard from '@/core/ai/components/question/QuestionCard'

export default ({ metaId, style }: { metaId: number; style?: CSSProperties }) => {
  const meta = MetaStore.useValue(metaId)
  const questions = meta?.properties?.[AI_QUESTION_PROP_ID]?.value as number[] | undefined
  const { openPopover, renderPopover, closePopover } = usePopoverCell({})

  return (
    <>
      <div
        role={'prop-container'}
        style={{ width: '100%', height: '100%', ...style }}
        onClick={e => {
          if (!questions?.length) return
          const parent = e.currentTarget.parentElement
          if (!parent) return
          openPopover(parent)
        }}
      >
        {questions?.length ?? ''}
      </div>
      {renderPopover(box => (
        <PopupWrapper box={{ ...box, width: 'min(450px, 90vw)' }}>
          <Content
            className={'overflowYAuto'}
            style={{
              maxHeight: '60vh'
            }}
          >
            {questions?.map(i => <QuestionCard id={i} key={i} />)}
          </Content>
        </PopupWrapper>
      ))}
    </>
  )
}
