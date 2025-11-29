import { IMediaAiSummary } from '~/typings'
import JSON5 from 'json5'
import { orderBy } from 'lodash'

import { AIService } from '@/api/services'
const getPrompt = (content: { time: number; text: string }[], lang: string) => {
  const lastTime = content[content.length - 1].time
  const minutes = lastTime / 60
  const outlineNum = Math.max(4, Math.min(Math.round(minutes / 5), 8))
  return `Please analyze the following JSON formatted audio transcription and return a JSON formatted summary of the content. The transcription format is as follows:
[
  { "time": number, "text": string }
]

The response should be formatted as follows:
{
  "summary": {
    "summary": string,
    "takeaways": [
      {
        "description": string,
        "time": number
      }
    ],
    "keywords": string[]
  },
  "outlines": [
    {
      "title": string,
      "time": number,
      "description": string,
      "highlights": [
        {
          "time": number,
          "description": string
        }
      ]
    }
  ]
}
Please ensure that:
1. The summary, takeaways, keywords, outlines, and highlights must all be in ${lang}.
2. There are at least ${outlineNum} outlines, each with at least 5 highlights, and all outlines and highlights should be sorted by time.
3. Outlines should cover the entire content comprehensively and can be evenly distributed based on the transcription time, ensuring that each outline summarizes a major section or theme of the transcription. 
4. For the takeaways, please provide comprehensive and specific points that cover the key aspects and details of the content.
5. For the highlights, ensure that each description includes sufficient context to understand the point being made
Here is the transcription data:
${JSON5.stringify(content)}
`
}

export default async (content: { time: number; text: string }[], lang: string, signal?: AbortSignal) => {
  const prompt = getPrompt(content, lang)
  const res = await AIService.ask<IMediaAiSummary>(prompt)
  return normalizeSummary(res)
}

const normalizeSummary = (sum: IMediaAiSummary) => {
  const normalized = {
    ...sum
  }
  normalized.outlines = orderBy(normalized.outlines, i => i.time, 'asc')
  normalized.outlines.forEach(i => {
    const minTime = Math.min(i.time, ...i.highlights.map(i => i.time))
    i.time = minTime
  })
  normalized.outlines.forEach((i, idx, arr) => {
    const next = arr[idx + 1]
    if (next) {
      const nextStart = next.time
      i.highlights = i.highlights.filter(i => i.time < nextStart)
    }
    i.highlights = orderBy(i.highlights, i => i.time, 'asc')
  })
  return normalized
}
