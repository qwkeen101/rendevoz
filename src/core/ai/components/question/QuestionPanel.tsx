import { AnimatePopover, Button, Content, WithBorder } from '@/components'
import QuestionCard from '@/core/ai/components/question/QuestionCard'
import { ClassName } from 'rendevoz'
import { memo, useState } from 'react'
import { Colors } from '@/consts'
import { IAIEvent } from '@/core/ai/components/AskAIPanel'
import Select from '@/components/base/select'
import { ObjectStore } from '@/api/stores'
import { css } from '@emotion/css'
export default memo(({ questions, on }: { questions?: number[]; on?: (e: IAIEvent) => any }) => {
  const [submitted, setSubmitted] = useState(false)
  return (
    <Content>
      <div
        style={{
          color: Colors.Font.Transparent,
          fontSize: 13,
          marginBottom: 4
        }}
      >
        Questions
      </div>
      <Content
        flex
        column
        gap={16}
        className={css({
          '> div': {
            paddingBottom: 16,
            ':not(:last-child)': {
              borderBottom: '1px solid var(--border-background)'
            }
          }
        })}
      >
        {questions?.map(i => <QuestionCard showAnswer={submitted} id={i} key={i} on={on} />)}
      </Content>
      <Content flex gap={16} style={{ marginTop: 12 }}>
        <div
          onClick={() => {
            setSubmitted(!submitted)
          }}
          style={{
            width: 'fit-content'
          }}
          className={ClassName.selectButton()}
        >
          {submitted ? '隐藏答案' : '提交'}
        </div>
        <AnimatePopover
          content={
            <WithBorder width={140} padding={6}>
              {[
                {
                  value: 'multiSelect',
                  children: '多选题'
                },
                {
                  value: 'singleSelect',
                  children: '单选题'
                },
                {
                  value: 'text',
                  children: '简答题'
                },
                {
                  value: 'trueOrFalse',
                  children: '判断题'
                }
              ].map(i => (
                <div
                  key={i.value}
                  onClick={() => {
                    const type = i.value
                    ObjectStore('question')
                      .addOne({ questionType: type, name: 'New question', choices: [] })
                      .then(o => {
                        on?.({ type: 'createQuestion', newQuestionId: o.id })
                      })
                  }}
                  className={ClassName.flatButton()}
                >
                  {i.children}
                </div>
              ))}
            </WithBorder>
          }
        >
          <Button.IconButton icon={'park-plus'} text={'创建问题'} />
        </AnimatePopover>
      </Content>
    </Content>
  )
})
