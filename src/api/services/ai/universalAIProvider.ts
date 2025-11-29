import { createXai } from '@ai-sdk/xai'
import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createMistral } from '@ai-sdk/mistral'
import { GlobalSetting } from '@/core'
import AIConsts from '@/core/ai/chat/AIConsts'
type Anthropic =
  | 'claude-4-opus-20250514'
  | 'claude-4-sonnet-20250514'
  | 'claude-3-7-sonnet-20250219'
  | 'claude-3-5-sonnet-latest'
  | 'claude-3-5-haiku-latest'
  | 'claude-3-opus-latest'
type XAI = 'grok-2' | 'grok-2-vision' | 'grok-3' | 'grok-3-fast' | 'grok-3-mini' | 'grok-3-mini-fast'
type OpenAI =
  | 'o4-mini'
  | 'o3'
  | 'o3-mini'
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4o-search-preview'
  | 'gpt-4o-mini-search-preview'
type Google =
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite'
  | 'gemini-2.5-pro-preview-05-06'
  | 'gemini-2.5-flash-preview-04-17'
  | 'gemma-3-27b-it'
type Mistral = 'ministral-3b-latest' | 'ministral-8b-latest' | 'mistral-large-latest' | 'mistral-small-latest' | 'pixtral-large-latest'
type Deepseek = 'deepseek-chat' | 'deepseek-reasoner'
export type IAvailableModels = XAI | Google | Mistral | OpenAI | Anthropic | Deepseek | 'custom' | 'official'
// Three providers support web search: ''
export default (opts?: { web?: boolean; reasoning?: boolean }) => {
  const setting = GlobalSetting.getSetting()
  const { provider, baseUrl, apiKey } = setting.AI
  if (provider === 'official' || provider === undefined) {
    return
  }
  if (provider === 'custom') {
    return createOpenAI({
      baseURL: baseUrl,
      apiKey: apiKey
    })
  }
  const models = AIConsts.Models
  for (const [brand, providerModels] of Object.entries(models)) {
    if (providerModels.includes(provider)) {
      switch (brand as keyof typeof models) {
        case 'XAI': {
          return createXai({
            baseURL: baseUrl,
            apiKey: apiKey
          })
        }
        case 'Anthropic': {
          return createAnthropic({
            baseURL: baseUrl,
            apiKey: apiKey
          })
        }
        case 'Deepseek': {
          return createDeepSeek({
            baseURL: baseUrl,
            apiKey: apiKey
          })
        }
        case 'Google': {
          return createGoogleGenerativeAI({
            baseURL: baseUrl,
            apiKey: apiKey
          })
        }
        case 'Mixtral': {
          return createMistral({
            baseURL: baseUrl,
            apiKey: apiKey
          })
        }
        case 'OpenAI': {
          return createOpenAI({
            baseURL: baseUrl,
            apiKey: apiKey
          })
        }
      }
    }
  }
}
