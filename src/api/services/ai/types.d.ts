import { CoreMessage } from 'ai'
import { Schema } from 'zod'
export type IChatStreamInput = (
  query: string | CoreMessage[],
  opts: {
    // ms=
    onEnd?: (timeUsed: number) => void
    onLoad: (text: string) => void
    onFailed?: () => void
    onReasoning?: (text: string) => void
    signal?: AbortSignal
    web?: boolean
    reasoning?: boolean
  }
) => Promise<void>

export type IStructuredResponseInput = <T>(
  query: string | CoreMessage[],
  opts: {
    schema: Schema<T>
    signal?: AbortSignal
    toast?: boolean
  }
) => Promise<T>
