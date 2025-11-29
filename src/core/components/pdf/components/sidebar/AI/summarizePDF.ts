import { AIService } from '@/api/services'
import JSON5 from 'json5'
import { IPDFAiSummary } from '~/typings'
import z from 'zod'

type PDFContent = {
  title: string
  pages: {
    text: string
    pageNumber: number
  }[]
}

const getPrompt = (content: PDFContent, lang = AIService.getAIOutputLanguage()) => {
  const pageLength = content.pages.length
  const outlines = Math.min(8, Math.max(Math.round(pageLength / 5), 3))
  return `You should summarize the given JSON-formatted PDF with the following structure:
{
  "title": "string",
  "pages": [
    {
      "text": string,
      "pageNumber": "number"
    }
  ]
}
Please ensure that:
1. The summary, takeaways, keywords, outlines, and highlights must all be in ${lang}.
2. There are at least ${outlines} outlines, each with at least 5 highlights, and all outlines and highlights should be sorted by page number.
3. Outlines should cover the entire document comprehensively and can be evenly distributed across the content, ensuring that each outline summarizes a major section or theme of the document. 
4. For the takeaways, please provide comprehensive and specific points that cover the key aspects and details of the content, including quotes from the original text. The quotes must exactly match the text from the original document without any alterations and must be in the original language.
5. For the highlights, ensure that each description includes sufficient context to understand the point being made, along with a relevant quote from the original text. The quotes must be exact replicas of the text from the original document and must be in the original language.
Here is the JSON-formatted PDF:
${JSON5.stringify(content)}
`
}

export default async (content: PDFContent, signal?: AbortSignal) => {
  const res = await AIService.chatStructured(getPrompt(content), {
    signal,
    schema: z.object({
      outlines: z.array(
        z.object({
          highlights: z.array(z.object({ pageNumber: z.number(), description: z.string(), quote: z.string() })),
          pageNumber: z.number(),
          title: z.string(),
          description: z.string()
        })
      ),
      summary: z.object({
        summary: z.string(),
        takeaways: z.array(
          z.object({
            quote: z.string(),
            pageNumber: z.number(),
            description: z.string()
          })
        ),
        keywords: z.array(z.string())
      })
    })
  })
  return res as IPDFAiSummary
}
