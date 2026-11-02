import { IEditorAISummary } from '~/typings'
import JSON5 from 'json5'
import { AIService } from '@/api/services'
import z from 'zod'
const getPrompt = (content: { title: string; paragraphs: { id: number; text: string }[] }, lang: string) => {
  const blockLength = content.paragraphs.length
  const outlineLength = Math.min(Math.max(3, Math.round(blockLength / 5)), 10)
  return `You should summarize the given JSON-formatted document with the following structure:
{
  "title": "string",
  "paragraphs": [
    {
      "text": string,
      "id": "number"
    }
  ]
}
Please ensure that:
1. The summary, takeaways, keywords, outlines, and highlights must all be in ${lang}.
2. There are at least ${outlineLength} outlines, each with at least 4 highlights, and all outlines and highlights should be sorted by paragraph order.
3. Outlines should cover the entire document comprehensively and can be evenly distributed across the content, ensuring that each outline summarizes a major section of the document. 
4. For the takeaways, provide comprehensive points that cover the key aspects and details of the content.
5. For the outlines and highlights, ensure that each description includes sufficient context to understand the point being made.
6. The 'id' of each outline, highlight and takeaway should correspond to the 'id' of a representative 'paragraph' that best summarizes its content.
Here is the JSON-formatted document:
${JSON5.stringify(content)}
`
}

export default async (content: { title: string; paragraphs: { id: number; text: string }[] }, lang: string, signal?: AbortSignal) => {
  const prompt = getPrompt(content, lang)
  const res = await AIService.chatStructured<IEditorAISummary>(prompt, {
    signal,
    schema: z.object({
      outlines: z.array(
        z.object({
          highlights: z.array(z.object({ id: z.number(), description: z.string() })),
          id: z.number(),
          title: z.string(),
          description: z.string()
        })
      ),
      summary: z.object({
        summary: z.string(),
        takeaways: z.array(
          z.object({
            id: z.number(),
            description: z.string()
          })
        ),
        keywords: z.array(z.string())
      })
    })
  })
  return res
}
