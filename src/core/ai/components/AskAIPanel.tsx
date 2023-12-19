import { IAI, IQuestion } from '~/typings'
import { Button, Content, Icon } from '@/components'
import QuestionPanel from './question/QuestionPanel'
import { ObjectStore } from '@/api/stores'
import { css } from '@emotion/css'
import { ClassName } from 'rendevoz'
import { memo, useEffect, useState } from 'react'
import { Colors } from '@/consts'
import caculateToken from '@/core/ai/utils/caculateToken'
import { AIService } from '@/api/services'
import SummaryCard from '@/core/ai/components/SummaryCard'
import Id from '@/utils/id'
import toast from 'react-hot-toast'

const multiSelectResult = {
  summary:
    '中国经济虽然整体复苏令人失望，但在电动汽车和可持续能源技术领域取得了惊人增长。渣打银行首席执行官比尔·温特斯表示，中国正逐步减压旧经济部门，加速发展新经济部门，特别是在电动汽车和可持续技术方面表现强劲。尽管中国的经济复苏仍有波动，但该国正在建设更有韧性、可持续和强大的经济。然而，房地产市场面临消费者信心下滑，恒大和碧桂园等房地产巨头陷入债务困境。渣打银行已在削减对中国房地产的敞口，力图应对市场动荡。温特斯指出，中国是该银行的重要市场之一，特别强调香港作为核心市场。渣打银行的离岸业务以香港为中心，每年增长50%至60%，成为其巨大增长故事的一部分。',
  questions: [
    {
      relatedIds: [15591334728541, 15779514394309, 15779514394437],
      question: '以下哪个领域是中国经济取得惊人增长的？',
      answer: ['电动汽车和可持续技术', '房地产', '传统制造业', '金融服务'],
      rightAnswerIndex: [0],
      explanation: '渣打银行首席执行官比尔·温特斯表示，中国在电动汽车和可持续技术领域表现强劲，这是经济增长的关键领域。'
    },
    {
      relatedIds: [15591334728546, 15779514394694, 15779514394696],
      question: '渣打银行对于中国房地产行业的敞口采取了什么措施？',
      answer: ['逐步削减', '加大投资', '全面扩张', '保持不变'],
      rightAnswerIndex: [0],
      explanation: '渣打银行首席执行官比尔·温特斯表示，该银行一直在逐步削减对中国陷入困境的房地产行业的敞口，以减轻市场波动带来的风险。'
    },
    {
      relatedIds: [15591334728550, 15779514394823, 15779514394825],
      question: '什么因素妨碍了中国的经济复苏？',
      answer: ['房地产下滑', '电动汽车市场不景气', '新冠疫情反弹', '大城市购房限制'],
      rightAnswerIndex: [0],
      explanation: '文章指出，中国经济复苏受到房地产下滑的阻碍，尽管一些大城市放宽了购房限制。'
    },
    {
      relatedIds: [15591334728552, 15779514394827, 15779514394829],
      question: '渣打银行的核心市场包括哪些地区？',
      answer: ['中国、印度、阿联酋、韩国、新加坡、香港', '欧洲各国', '北美地区', '拉丁美洲'],
      rightAnswerIndex: [0],
      explanation: '渣打银行首席执行官比尔·温特斯指出，渣打银行的核心市场包括中国、印度、阿联酋、韩国、新加坡和香港。'
    },
    {
      relatedIds: [15591334728543, 15779514394565, 15779514394569],
      question: '中国在哪个领域拥有世界最大的市场份额？',
      answer: ['电动汽车', '传统制造业', '金融服务', '房地产'],
      rightAnswerIndex: [0],
      explanation:
        '根据Canalys的研究，中国拥有世界上最大的电动汽车市场，2022年销量占全球电动汽车销量的59%。因此，电动汽车领域是中国拥有世界最大市场份额的领域。'
    }
  ]
}
const normalized: { summary: string; questions: IQuestion[] } = {
  summary: multiSelectResult.summary,
  questions: multiSelectResult.questions.map((i, index) => ({
    id: index + 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    specType: 'question',
    answerType: 'pointer',
    answerPointers: [
      ...i.relatedIds.map(i => ({
        pointerType: 'documentBlock',
        blockId: i
      }))
    ],
    questionType: 'multiSelect',
    choices: i.answer,
    name: i.question,
    sAnswer: [...i.rightAnswerIndex.map(o => i.answer[o])],
    explanation: i.explanation
  }))
}
document.addEventListener('DOMContentLoaded', () => {
  normalized.questions.forEach(i => {
    ObjectStore('question').addOne(i)
  })
})
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

export type AISummarizeEvent = { summary: string; questions: IQuestion[] }

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
    on
  }: IAI & {
    onAskAI?: VoidFunction
    onSummarized?: (res: AISummarizeEvent) => void
    content?: string
    on?: (e: IAIEvent) => void
  }) => {
    const [token, setToken] = useState<number>()
    const [isSummarizing, setIsSummarizing] = useState(false)
    useEffect(() => {
      if (content) {
        setToken(caculateToken(content))
      }
    }, [content])

    const normalizeResult = (result: IAIResult, questionType: IQuestion['questionType']): AISummarizeEvent => {
      switch (questionType) {
        case 'text': {
          return {
            summary: result.summary,
            questions: result.questions.map(i => ({
              id: Id.getId(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              specType: 'question',
              answerType: 'pointer',
              answerPointers: [
                ...i.relatedIds.map(i => ({
                  pointerType: 'documentBlock',
                  blockId: i,
                  id: Id.getId()
                }))
              ],
              questionType: 'text',
              name: i.question,
              sAnswer: i.answer,
              explanation: i.answer
            }))
          }
        }
        case 'singleSelect': {
          return
        }
        case 'trueOrFalse': {
          return {
            summary: result.summary,
            questions: result.questions.map(i => ({
              id: Id.getId(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              specType: 'question',
              answerType: 'pointer',
              answerPointers: [
                ...i.relatedIds.map(i => ({
                  pointerType: 'documentBlock',
                  blockId: i
                }))
              ],
              questionType: 'trueOrFalse',
              name: i.question,
              sAnswer: i.answer,
              explanation: i.explanation
            }))
          }
        }
        case 'multiSelect': {
          return {
            summary: result.summary,
            questions: result.questions.map(i => ({
              id: Id.getId(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              specType: 'question',
              answerType: 'pointer',
              answerPointers: [
                ...i.relatedIds.map(i => ({
                  pointerType: 'documentBlock',
                  blockId: i
                }))
              ],
              questionType: 'multiSelect',
              choices: i.answer,
              name: i.question,
              sAnswer: [...i.rightAnswerIndex.map(o => i.answer[o])],
              explanation: i.explanation
            }))
          }
        }
      }
    }

    const handleAskAI = async () => {
      onAskAI?.()
      if (content) {
        setIsSummarizing(true)
        try {
          const result = await AIService.askJSONDocument(content, {
            questionType: 'multiSelect'
          })
          toast.success('Credit usage: ' + result.creditUsage, {
            duration: 1500
          })
          const norm = normalizeResult(result.result, 'multiSelect')
          onSummarized?.(norm)
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
          gap={10}
          style={{
            marginTop: 18
          }}
        >
          <Button.IconButton
            onClick={handleAskAI}
            spin={isSummarizing}
            icon={isSummarizing ? 'park-loading-four' : 'custom-stars'}
            text={isSummarizing ? 'Summarizing article...' : 'Generate AI summary'}
            className={ClassName.selectButton()}
            style={{
              fontWeight: 600,
              padding: '3px 12px',
              width: 'fit-content',
              fontSize: 14
            }}
          ></Button.IconButton>
          <Content flex gap={6} style={{ color: Colors.Common.SelectColor, fontSize: 13, fontWeight: 600 }}>
            Estimated credit usage: {Math.round((((token ?? 0) * 0.67 + 1000 * 1.33) * 1.2) / 100)}
          </Content>
        </Content>
        <div
          style={{
            fontSize: 12,
            color: Colors.Font.Transparent,
            maxWidth: '80%',
            textAlign: 'center'
          }}
        >
          Rendevoz AI can summarize article and ask questions for you. The article must have at least 100 letters and not more than 10000
          letters.
        </div>
      </Content>
    )

    if (!summary && !questions?.length) {
      return renderPlaceholder()
    }
    const renderContent = () => {
      return (
        <Content fullHeight style={{ overflowY: 'auto', padding: '6px 10px 24px 10px' }}>
          <SummaryCard summary={summary} />
          <QuestionPanel
            on={e => {
              return on?.(e)
            }}
            questions={questions}
          />
        </Content>
      )
    }
    return renderContent()
  }
)
