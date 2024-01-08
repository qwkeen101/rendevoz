import { AnimatePopover, Button, Content, WithBorder } from '@/components'
import QuestionCard from '@/core/ai/components/question/QuestionCard'
import { ClassName } from 'rendevoz'
import { memo, useState } from 'react'
import { Colors } from '@/consts'
import { IAIEvent } from '@/core/ai/components/AskAIPanel'
import Select from '@/components/base/select'
import { ObjectStore } from '@/api/stores'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'
export default memo(({ questions, on }: { questions?: number[]; on?: (e: IAIEvent) => any }) => {
  const [submitted, setSubmitted] = useState(false)
  const { t } = useTranslation()
  return (
    <Content>
      <div
        style={{
          color: Colors.Font.Transparent,
          fontSize: 13,
          padding: '0px 12px'
        }}
      >
        {t('general.Questions')}
      </div>
      <Content
        flex
        column
        gap={24}
        className={css({
          '> div': {
            paddingBottom: 24,
            ':not(:last-child)': {
              borderBottom: '1px solid var(--border-background)'
            }
          }
        })}
      >
        {questions?.map(i => <QuestionCard showAnswer={submitted} id={i} key={i} on={on} />)}
      </Content>
      <Content flex gap={16} style={{ padding: '0px 12px 36px' }}>
        <div
          onClick={() => {
            setSubmitted(!submitted)
          }}
          style={{
            width: 'fit-content'
          }}
          className={ClassName.selectButton()}
        >
          {submitted ? t('general.Hide answers') : t('general.Show answers')}
        </div>
        {/*<AnimatePopover*/}
        {/*  content={*/}
        {/*    <WithBorder width={140} padding={6}>*/}
        {/*      {['multiSelect', 'singleSelect', 'text', 'trueOrFalse', 'cloze']*/}
        {/*        .map(i => ({ value: i, children: t(`general.${i} question`) }))*/}
        {/*        .map(i => (*/}
        {/*          <div*/}
        {/*            key={i.value}*/}
        {/*            onClick={() => {*/}
        {/*              const type = i.value*/}
        {/*              ObjectStore('question')*/}
        {/*                .addOne({ questionType: type, name: 'New question', choices: [] })*/}
        {/*                .then(o => {*/}
        {/*                  on?.({ type: 'createQuestion', newQuestionId: o.id })*/}
        {/*                })*/}
        {/*            }}*/}
        {/*            className={ClassName.flatButton()}*/}
        {/*          >*/}
        {/*            {i.children}*/}
        {/*          </div>*/}
        {/*        ))}*/}
        {/*    </WithBorder>*/}
        {/*  }*/}
        {/*>*/}
        {/*  <Button.IconButton*/}
        {/*    style={{*/}
        {/*      border: Colors.Consts.Border*/}
        {/*    }}*/}
        {/*    icon={'park-plus'}*/}
        {/*    text={t('general.Create question')}*/}
        {/*  />*/}
        {/*</AnimatePopover>*/}
      </Content>
    </Content>
  )
})
