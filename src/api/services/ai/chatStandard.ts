// legacy chat completion api, later will switch to responses when proxy available

import { GlobalSetting } from '@/core'
import trans from '@/consts/trans'
import OpenAI from 'openai'
import isAbortError from '@/api/common/isAbortError'
import toast from 'react-hot-toast'
import { t } from 'i18next'
import { Queue } from 'async-await-queue'
import Interface from '@/api/services/interface'
import { getAuthToken } from '@/config/axiosClient'
import errorCodeToTrans from '@/api/services/errorCodeToTrans'
import { delay } from '@/utils'
import UserService from '@/api/services/user.service'
import { IChatStreamInput, IStructuredResponseInput } from '@/api/services/ai/types'
import { normalizeAIQuery, normalizeEasyMessagesToStandard, parseEvent } from '@/api/services/ai/utils'
import { EasyInputMessage } from 'openai/resources/responses/responses'
import { request } from '@/utils/request'
import { IWebRequest } from '~/typings'
import universalAIProvider, { IAvailableModels } from '@/api/services/ai/universalAIProvider'
import { generateObject, streamText } from 'ai'

const chatLocalStream: IChatStreamInput = async (query, opts) => {
  const provider = universalAIProvider()
  const model = GlobalSetting.getSetting().AI.provider as IAvailableModels
  if (!provider) {
    setTimeout(() => {
      GlobalSetting.focusSetting('AI', 'openaiApiKey')
    })
    return Promise.reject(trans.AI.NeedSetupOpenAIKey)
  }
  const startAt = Date.now()
  const messages = [...normalizeEasyMessagesToStandard(query)]
  console.log(messages)
  const result = streamText({
    model: provider.languageModel(model, {
      reasoningEffort: opts.reasoning ? 'medium' : undefined
    }),
    messages,
    abortSignal: opts.signal,
    onFinish: () => {
      const timeUsed = Date.now() - startAt
      opts.onEnd?.(timeUsed)
    },
    onError: e => {
      console.log(e)
      opts?.onFailed?.()
      if (!isAbortError(e.error)) {
        toast.error(t(trans.Errors.NetworkError))
      }
      return Promise.reject()
    }
  })
  for await (const chunk of result.fullStream) {
    console.log(chunk)
    switch (chunk.type) {
      case 'reasoning': {
        opts?.onReasoning?.(chunk.textDelta)
        break
      }
      case 'text-delta': {
        opts.onLoad(chunk.textDelta)
        break
      }
    }
  }
}
const chatRemoteStream: IChatStreamInput = async (query, opts) => {
  const queue = new Queue()
  const id = 1
  let prevTime = Date.now()
  const res = await fetch(Interface.AI('chatStream'), {
    method: 'POST',
    body: JSON.stringify({
      data: normalizeEasyMessagesToStandard(query),
      web: opts.web,
      reasoning: opts.reasoning
    }),
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': await getAuthToken()
    },
    signal: opts.signal
  })
  if (res.headers.get('Content-Type')?.includes('application/json')) {
    const body = await res.json()
    if (body.status === 'ERROR') {
      const errorCode = body.code
      if (errorCodeToTrans[errorCode]) {
        toast.error(t(errorCodeToTrans[errorCode]))
        return Promise.reject()
      }
      return Promise.reject()
    }
  }
  const reader = res.body?.getReader()
  const decoder = new TextDecoder('utf-8')
  if (!reader) return
  let buffer = ''
  const handleMessage = async (v: string) => {
    await queue.wait(id)
    opts.onLoad(v)
    const spentTime = Date.now() - prevTime
    const diff = Math.max(30 - spentTime, 10)
    if (diff) {
      await delay(diff)
    }
    prevTime = Date.now()
    queue.end(id)
  }
  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // 处理完整的事件块
    let endOfEvent = buffer.indexOf('\n\n')
    while (endOfEvent > -1) {
      const eventStr = buffer.slice(0, endOfEvent).trim()
      buffer = buffer.slice(endOfEvent + 2) // 跳过 \n\n

      if (eventStr) {
        const event = parseEvent(eventStr)
        if (event.data) {
          const parsed = JSON.parse(event.data).data
          if (parsed) {
            handleMessage(parsed)
          }
        }
      }

      endOfEvent = buffer.indexOf('\n\n')
    }
  }
}

export const chatStreamStandard: IChatStreamInput = async (query, opts) => {
  const isPro = UserService.isUserPro(true)
  if (!isPro) {
    toast.error(t(trans.Errors.NotProUser))
    return Promise.reject()
  }
  const setting = GlobalSetting.getSetting()
  const normalizedMessages = (await normalizeAIQuery(query)) as EasyInputMessage[]
  if (setting.AI.provider !== 'official' && setting.AI.provider !== undefined) {
    return await chatLocalStream(normalizedMessages, opts)
  }
  return await chatRemoteStream(normalizedMessages, opts)
}

const chatLocal: IStructuredResponseInput = async (query, opts) => {
  const provider = universalAIProvider()
  if (!provider) {
    setTimeout(() => {
      GlobalSetting.focusSetting('AI', 'openaiApiKey')
    })
    return Promise.reject(trans.AI.NeedSetupOpenAIKey)
  }
  try {
    const res = await generateObject({
      messages: normalizeEasyMessagesToStandard(query),
      model: provider?.languageModel(GlobalSetting.getSetting().AI.provider!),
      schema: opts.schema,
      abortSignal: opts.signal
    })
    if (res) {
      try {
        return res.object
      } catch (e) {
        console.log(e)
        return Promise.reject(trans.AI.FailedToGetResult)
      }
    }
  } catch (e) {
    console.log(e)
    if (!isAbortError(e) && opts.toast !== false) {
      toast.error(t(trans.Errors.NetworkError))
    }
    return Promise.reject()
  }
}

const chatRemote: IStructuredResponseInput = async (query, opts) => {
  const data = await request<IWebRequest<{ data: string; creditUsage: number }>>(Interface.AI('ask'), {
    method: 'POST',
    data: {
      data: normalizeEasyMessagesToStandard(query)
    },
    toast: opts.toast,
    signal: opts.signal
  })
  return JSON.parse(data.data.result.data)
}

export const chatStructuredStandard: IStructuredResponseInput = async (query, opts) => {
  const isPro = UserService.isUserPro(true)
  if (!isPro) {
    if (opts.toast !== false) {
      toast.error(t(trans.Errors.NotProUser))
    }
    return Promise.reject()
  }
  const normalizedQuery = await normalizeAIQuery(query)
  const setting = GlobalSetting.getSetting()
  if (setting.AI.provider !== 'official' && setting.AI.provider !== undefined) {
    return await chatLocal(normalizedQuery, opts)
  }
  return await chatRemote(normalizedQuery, opts)
}
