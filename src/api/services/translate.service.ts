import JSON5 from 'json5'
import { AIService } from '@/api/services/index'
import { GlobalSetting } from '@/core'
import UserService from '@/api/services/user.service'
import langCodes from '@/assets/languageCodes.json'
import z from 'zod'
import { CoreMessage } from 'ai'
import translate from '@/api/services/translate'

const TranslateService = {
  getTranslateLanguage: (tag = true) => {
    const setting = GlobalSetting.getSetting()
    const language = setting.general.translateTargetLanguage
    if (tag) {
      return language
    } else {
      return langCodes.find(i => i.tag === language)?.language || 'English'
    }
  },
  freeTranslateText: async (
    query: string,
    opts?: {
      target?: string
    }
  ) => {
    return (await translate(query, opts?.target ?? TranslateService.getTranslateLanguage(), 'microsoft')) as string
  },
  freeTranslateJSON: async (query: { text: string; id: number }[]) => {
    return await Promise.all(
      query.map(async i => ({
        id: i.id,
        text: await TranslateService.freeTranslateText(i.text)
      }))
    )
  },
  translateText: async (query: string, signal?: AbortSignal) => {
    const setting = GlobalSetting.getSetting()
    if (setting.AI.aiTranslator && UserService.isUserPro(true)) {
      return await TranslateService.AItranslateText(query, signal)
    }
    return await TranslateService.freeTranslateText(query)
  },
  translateTextStream: async (query: string, onLoad: (text: string) => void, signal?: AbortSignal) => {
    const setting = GlobalSetting.getSetting()
    if (setting.AI.aiTranslator && UserService.isUserPro(true)) {
      return await TranslateService.AItranslateTextStream(query, onLoad, signal)
    }
    const res = await TranslateService.freeTranslateText(query)
    onLoad(res)
  },
  translateJSON: async (query: { text: string; id: number }[], prompt?: string, signal?: AbortSignal) => {
    const setting = GlobalSetting.getSetting()
    if (setting.AI.aiTranslator) {
      return await TranslateService.AItranslateJSON(query, prompt, signal)
    }
    return await TranslateService.freeTranslateJSON(query)
  },
  chunkJSON: (query: { text: string; id: number }[], max = 500) => {
    const contentLength = JSON.stringify(query).length
    if (contentLength > 1500) {
      const grouped: {
        items: { text: string; id: number }[]
        context: string
      }[] = []
      const chunked: { text: string; id: number }[][] = []
      query.forEach(q => {
        const last = chunked[chunked.length - 1]
        const totalLength = last ? last.map(i => i.text).join('').length : 0
        if (totalLength < max && last) {
          last.push(q)
        } else {
          chunked.push([q])
        }
      })
      chunked.forEach((c, idx, arr) => {
        const prev = arr[idx - 1]
        if (prev) {
          grouped.push({
            context: prev.map(i => i.text).join(''),
            items: c
          })
        } else {
          grouped.push({
            items: c,
            context: ''
          })
        }
      })
      return grouped
    } else {
      return [
        {
          items: query,
          context: ''
        }
      ]
    }
  },
  AItranslateJSON: async (query: { text: string; id: number }[], prompt?: string, signal?: AbortSignal) => {
    const chunked = TranslateService.chunkJSON(query)
    const schema = z.array(
      z.object({
        text: z.string(),
        id: z.number()
      })
    )
    const final = await Promise.all(
      chunked.map(async i => {
        const context = i.context || prompt
        if (context)
          return await AIService.chatStructured<
            {
              text: string
              id: number
            }[]
          >(getJSONWithContextPrompt(i.items, context.slice(-200), TranslateService.getTranslateLanguage(false)), { signal, schema })

        return await AIService.chatStructured<
          {
            text: string
            id: number
          }[]
        >(getJSONPrompt(i.items, TranslateService.getTranslateLanguage(false)), {
          signal,
          schema
        })
      })
    )
    return final.flat()
  },
  AItranslateText: async (query: string, signal?: AbortSignal) => {
    const prompt = getTextPrompt(query, TranslateService.getTranslateLanguage(false))
    return await AIService.chatStructured<string>(prompt, { signal, schema: z.string() })
  },
  AItranslateTextStream: async (query: string, onLoad: (text: string) => void, signal?: AbortSignal) => {
    const prompt = getTextPrompt(query, TranslateService.getTranslateLanguage(false))
    return await AIService.chatStream(prompt, { onLoad, signal })
  },
  translateImageStream: async (imageBase64: string, onLoad: (text: string) => void, signal?: AbortSignal) => {
    const prompt: CoreMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Translate the following image from the source language to ${TranslateService.getTranslateLanguage(false)}. The output should only be the translated text.`
          },
          {
            type: 'image',
            image: imageBase64
          }
        ]
      }
    ]
    return await AIService.chatStream(prompt, { onLoad, signal })
  }
}

const getTextPrompt = (content: string, language: string) => {
  return `Translate the following content from the source language to ${language}. The output should only be the translated text. Here is the content: ${content}`
}

const getJSONWithContextPrompt = (content: { text: string; id: number }[], context: string, language: string) => {
  return `Translate the following JSON document from the source language to the target language. Each translation should consider the provided context. The input is in the format:
{
    "targetLanguage": "string",
    "context": "string",
    "content": [
        {
            "text": "string",
            "id": "number"
        }
    ]
}
Your task is to translate the text field of each object in the content array into the specified targetLanguage, using the context to inform the translation. Ensure that the output maintains the same structure and order as the input, with each translated text corresponding to the same id.
Translate only the text field while preserving the id. Make sure the length and order of the content array remain unchanged. Here is the document:
${JSON5.stringify({
  content,
  context,
  targetLanguage: language
})}
`
}
const getJSONPrompt = (content: { text: string; id: number }[], language: string) => {
  return `Translate the following JSON document from the source language to the target language. The input is in the format:
{
    "targetLanguage": "string",
    "content": [
        {
            "text": "string",
            "id": "number"
        }
    ]
}
Your task is to translate the text field of each object in the content array to the specified targetLanguage. Ensure that the output maintains the same structure and order as the input, with each translated text corresponding to the same id.
Translate only the text field while preserving the id. Make sure the length and order of the content array remain unchanged.
Here is the document:
${JSON5.stringify({
  content,
  targetLanguage: language
})}
`
}

export default TranslateService
