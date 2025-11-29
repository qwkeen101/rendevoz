import { IAISearchTask } from '@/api/services/ai/deepsearch/runSearchTask'
import { AIService } from '@/api/services'
import { finalReportPrompt, systemInstruction } from '@/api/services/ai/deepsearch/consts'

export default async (query: string, tasks: IAISearchTask[]) => {
  const sources = tasks
    .map(i => i.sources)
    .flat(1)
    .map(
      (item, idx) =>
        `<source index="${idx + 1}" source="${item.source || ''}" abstract="${item.abstract || ''}" content="${item.content || ''}" type="${item.type}">\n${item.title || ''}\n</source>`
    )
  const prompt = finalReportPrompt.replace('{query}', query).replace('{sources}', sources.join('\n'))
  let str = ''
  await AIService.chatStream(
    [
      {
        role: 'system',
        content: systemInstruction.replace('{now}', new Date().toISOString()).replace('{language}', AIService.getAIOutputLanguage())
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    {
      onLoad: text => {
        str += text
        console.log(str)
      }
    }
  )
}
