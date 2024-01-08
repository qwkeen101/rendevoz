import { IQuestion, IWebRequest } from '~/typings'
import { IAIResult } from '@/core/ai/components/AskAIPanel'
import { request } from '@/utils/request'
import { IAIResponse } from '~/typings'
import UserService from '@/api/services/user.service'

const LOCAL_AI_ENDPOINT = 'http://localhost:9000/ai'
const REMOTE_AI_ENDPOINT = 'https://api.rendevoz.com/ai'
const ASK_JSON_DOC_ENDPOINT = '/summarizeAndAsk/json'
export const askJSONDocument = async (
  content: string,
  options: {
    questionType: IQuestion['questionType']
    questionNum?: number
    language?: string
  }
): Promise<IAIResponse> => {
  const stringJSON = content
  const res = await request<IWebRequest<IAIResponse>>(REMOTE_AI_ENDPOINT + ASK_JSON_DOC_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      content: stringJSON,
      questionType: options.questionType,
      questionNum: options.questionNum,
      language: options.language
    }
  })
  if (res.data.status === 'ERROR') {
    throw res.data.message
  }
  UserService.getUserDetails()
  return res.data.result
}
