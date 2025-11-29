import { IMediaAiSummary } from '~/typings'
import JSON5 from 'json5'
import { orderBy } from 'lodash'

import { AIService } from '@/api/services'
import z from 'zod'
const getPrompt = (content: { time: number; text: string }[], lang: string) => {
  const lastTime = content[content.length - 1].time
  const minutes = lastTime / 60
  const outlineNum = Math.max(4, Math.min(Math.round(minutes / 5), 8))
  return `Please analyze the following JSON formatted audio transcription and return a JSON formatted summary of the content. The transcription format is as follows:
[
  { "time": number, "text": string }
]
Ensure that:
1. All sections must be in ${lang}.
2. There are at least ${outlineNum} outlines, each with at least 5 highlights, and all outlines and highlights should be sorted by time.
3. The time attribute for each takeaway, outline, and highlight must accurately match the relevant section in the original transcription.
4. Outlines should cover the entire content comprehensively, ensuring that each outline summarizes a major section of the transcription.
5. The takeaways should provide comprehensive and specific points that cover the key aspects and details of the content.
6. For the highlights, ensure that each description includes sufficient context to understand the point being made.
7. The time for each highlight within an outline must be less than the time of the next outline, ensuring a logical chronological order.
Here is the transcription data: ${JSON5.stringify(content)}`
}

export default async (content: { time: number; text: string }[], lang: string, signal?: AbortSignal) => {
  const prompt = getPrompt(content, lang)
  const res = await AIService.chatStructured<IMediaAiSummary>(prompt, {
    signal,
    schema: z.object({
      outlines: z.array(
        z.object({
          highlights: z.array(z.object({ time: z.number(), description: z.string() })),
          time: z.number(),
          title: z.string(),
          description: z.string()
        })
      ),
      summary: z.object({
        summary: z.string(),
        takeaways: z.array(
          z.object({
            time: z.number(),
            description: z.string()
          })
        )
      })
    })
  })
  return normalizeSummary(res)
}

const normalizeSummary = (sum: IMediaAiSummary) => {
  const normalized = {
    ...sum
  }
  normalized.outlines.forEach(i => {
    const minTime = Math.min(i.time, ...i.highlights.map(i => i.time))
    i.time = minTime
  })
  normalized.outlines.forEach(i => {
    i.highlights = orderBy(i.highlights, i => i.time, 'asc')
  })
  normalized.outlines = orderBy(normalized.outlines, i => i.time, 'asc')
  return normalized
}
