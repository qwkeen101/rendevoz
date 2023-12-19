import { encodingForModel } from 'js-tiktoken'

export default (content: string) => {
  const GPT35TURBOENC = encodingForModel('gpt-3.5-turbo-1106')
  const tokens = GPT35TURBOENC.encode(content).length
  return tokens
}
