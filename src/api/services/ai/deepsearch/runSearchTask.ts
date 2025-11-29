import { IAISearchSource } from '~/typings'
import universalAISearch from '@/api/services/ai/universalAISearch'
import { AIService } from '@/api/services'
import { furtherSearchPrompt } from '@/api/services/ai/deepsearch/consts'
import z from 'zod'
import furtherRead from '@/api/services/ai/deepsearch/furtherRead'
import acedemicSearch from '@/api/services/ai/acedemicSearch'

export type IAISearchTask = {
  id: number
  state: 'unprocessed' | 'processing' | 'completed' | 'failed' | 'reading'
  query: string
  researchGoal: string
  scholar?: boolean
  web?: boolean
  sources: IAISearchSource[]
  // ids
  reading?: number[]
}

export default async (tasks: IAISearchTask[], onTaskUpdate?: (task: Partial<IAISearchTask>) => void) => {
  await Promise.allSettled(
    tasks.map(async item => {
      let sources: IAISearchSource[] = []
      let scholarSources: IAISearchSource[] = []
      onTaskUpdate?.({ state: 'processing', id: item.id })
      try {
        if (item.web) {
          const results = await universalAISearch(item.query)
          if (results?.length) {
            sources = results
          }
        }
        if (item.scholar) {
          scholarSources = await acedemicSearch(item.query)
        }
      } catch (err) {
        console.error(err)
        return Promise.reject(err)
      }
      let finalSources = [...sources, ...scholarSources]
      if (!finalSources.length) {
        throw 'No valid source!'
      }
      const { selected, readmore } = await AIService.chatStructured<{
        selected: number[]
        readmore: number[]
      }>(
        [
          {
            role: 'user',
            content: furtherSearchPrompt
              .replace('{query}', item.query)
              .replace('{goal}', item.researchGoal)
              .replace(
                '{results}',
                sources
                  .map(
                    i =>
                      `<result id="${i.id}" source="${i.source}" type="${i.type}" abstract="${i.abstract}" pdfURL="${i.pdfDownloadUrl}">\n${i.title}\n</result>`
                  )
                  .join('\n')
              )
          }
        ],
        {
          schema: z.object({
            selected: z.array(z.number()),
            readmore: z.array(z.number())
          })
        }
      )
      finalSources = finalSources.filter(i => selected.includes(i.id))
      if (readmore.length) {
        onTaskUpdate?.({
          state: 'reading',
          id: item.id,
          sources: structuredClone(finalSources),
          reading: structuredClone(finalSources.filter(i => readmore.includes(i.id)).map(i => i.id))
        })
        await Promise.allSettled(
          readmore.map(async id => {
            const target = finalSources.find(i => i.id === id)
            if (target) {
              const content = await furtherRead(target)
              if (content) {
                // clean str
                target.content = content.replace(/\s+/g, ' ').trim()
              }
            }
          })
        )
      }
      onTaskUpdate?.({ state: 'completed', id: item.id, sources: finalSources })
      return
    })
  )
}
