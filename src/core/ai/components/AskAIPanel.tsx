import { IAI, IQuestion } from '~/typings'
import { Button, Content, Icon } from '@/components'
import QuestionPanel from './question/QuestionPanel'
import { ClassName } from 'rendevoz'
import { memo, ReactNode, useEffect, useState } from 'react'
import { Colors } from '@/consts'
import caculateToken from '@/core/ai/utils/caculateToken'
import { AIService } from '@/api/services'
import SummaryCard from '@/core/ai/components/SummaryCard'
import toast from 'react-hot-toast'
import { getSetting } from '@/core'
import langs from '@/consts/langs'
import { useTranslation } from 'react-i18next'
import normalizeAIResult from '@/core/ai/utils/normalizeAIResult'

export type IAIEvent =
  | {
      type: 'questionGotoOriginalPlace'
      originalId: number
    }
  | {
      type: 'createQuestion'
      newQuestionId: number
    }
  | {
      type: 'getOriginalText'
      originalId: number
    }

export type AISummarizeEvent = { summary: string; questions: (Omit<IQuestion, 'answerPointers'> & { answerPointers: number[] })[] }

export type IAIResult = {
  summary: string
  questions: {
    question: string
    choices?: string[]
    answer: string | string[] | boolean
    relatedIds: number[]
    explanation: string
    rightAnswerIndex?: number | number[]
  }[]
}

export default memo(
  ({
    questions,
    summary,
    onAskAI,
    onSummarized,
    content,
    extraPlaceholder,
    on
  }: IAI & {
    onAskAI?: VoidFunction
    onSummarized?: (res: AISummarizeEvent) => void
    content?: string
    on?: (e: IAIEvent) => void
    extraPlaceholder?: (canSum: boolean) => ReactNode
  }) => {
    const [token, setToken] = useState<number>()
    const [isSummarizing, setIsSummarizing] = useState(false)
    const [canSummarize, setCanSummarize] = useState(true)
    const [needResummarize, setNeedResummarize] = useState(false)
    useEffect(() => {
      if (content) {
        // eagerly return here
        if (content.length > 20000) {
          setCanSummarize(false)
          return
        }
        const token = caculateToken(content)
        setToken(token)
        if (token > 12000) {
          setCanSummarize(false)
          return
        }
        setCanSummarize(true)
      }
    }, [content])
    const { t } = useTranslation()
    const handleAskAI = async () => {
      if (isSummarizing) return
      onAskAI?.()
      if (content && canSummarize) {
        setIsSummarizing(true)
        try {
          const setting = getSetting()
          const gen = setting.AI.autoGenerateQuestionAfterSummarizing
          const qType = setting.AI.questionGenerateType || 'text'
          const result = await AIService.askJSONDocument(content, {
            questionType: qType,
            questionNum: gen ? setting.AI.questionGenerateNum ?? 5 : 0,
            language: langs[setting.AI.outputLanguage]
          })
          const norm = normalizeAIResult(result.result, qType)
          console.log(norm)
          onSummarized?.(norm)
          setNeedResummarize(false)
        } catch (e) {
          toast.error(typeof e === 'string' ? e : e.message)
        }
        setIsSummarizing(false)
      }
    }
    const renderPlaceholder = () => (
      <Content fullHeight flex column alignItems={'center'} justifyContent={'center'} gap={12}>
        <Icon name={'custom-bot'} fill={'url(#mygradient)'} size={88} />
        <Content
          flex
          column
          alignItems={'center'}
          gap={16}
          style={{
            marginTop: 18
          }}
        >
          {canSummarize ? (
            <>
              <Button.IconButton
                onClick={handleAskAI}
                spin={isSummarizing}
                icon={isSummarizing ? 'park-loading-four' : 'custom-stars'}
                text={isSummarizing ? t('ai.Generating summary') : t('ai.Generate summary')}
                className={ClassName.selectButton()}
                style={{
                  fontWeight: 600,
                  padding: '3px 12px',
                  width: 'fit-content',
                  fontSize: 14
                }}
              ></Button.IconButton>
              <Content className={'font-size-13 normal-font select-color-font'} flex gap={6}>
                {t('ai.Estimated credit usage')}: {Math.round((((token ?? 0) * 0.67 + 500 * 1.33) * 1.4) / 100)}
              </Content>
            </>
          ) : (
            <Content
              className={'font-size-14 normal-font'}
              flex
              alignItems={'center'}
              gap={12}
              style={{
                color: Colors.Common.Red
              }}
            >
              <Icon name={'park-close'} size={16} />
              {t('ai.Can not summarize')}
            </Content>
          )}
          {extraPlaceholder?.(canSummarize)}
          {(summary || questions?.length) && (
            <Button.IconButton
              text={t('footer.back')}
              icon={'park-return'}
              onClick={() => setNeedResummarize(false)}
              style={{ fontSize: 14, fontWeight: 500 }}
            ></Button.IconButton>
          )}
        </Content>
      </Content>
    )

    if ((!summary && !questions?.length) || isSummarizing || needResummarize) {
      return renderPlaceholder()
    }
    const renderContent = () => {
      return (
        <Content fullHeight className={'overflowYAuto'}>
          <Content
            flex
            justifyContent={'space-between'}
            alignItems={'center'}
            className={'font-size-14 normal-font border-bottom'}
            style={{
              padding: '6px 12px'
            }}
          >
            <div>{t('general.Ask AI')}</div>
            {summary || questions?.length ? (
              <Button.IconButton
                icon={'park-redo'}
                className={'transparent-font slim-font'}
                text={t('general.Resummarize')}
                onClick={() => {
                  setNeedResummarize(true)
                }}
              />
            ) : null}
          </Content>
          <SummaryCard summary={summary} />
          {questions?.length ? (
            <QuestionPanel
              on={e => {
                return on?.(e)
              }}
              questions={questions}
            />
          ) : null}
        </Content>
      )
    }
    return renderContent()
  }
)
