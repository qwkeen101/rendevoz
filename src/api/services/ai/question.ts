import { IQuestion, IWebRequest } from '~/typings'
import { IAIResult } from '@/core/ai/components/AskAIPanel'
import { request } from '@/utils/request'
import { IAIResponse } from '~/typings'

const LOCAL_AI_ENDPOINT = 'http://localhost:9000/ai'

const ASK_JSON_DOC_ENDPOINT = '/summarizeAndAsk/json'
export const askJSONDocument = async (
  content: string,
  options: {
    questionType: IQuestion['questionType']
    questionNum?: number
  }
): Promise<IAIResponse> => {
  const stringJSON = content
  const res = await request<IWebRequest<IAIResponse>>(LOCAL_AI_ENDPOINT + ASK_JSON_DOC_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      content: stringJSON,
      questionType: options.questionType,
      questionNum: options.questionNum
    }
  })
  if (res.data.status === 'ERROR') {
    throw res.data.message
  }
  return res.data.result
}
