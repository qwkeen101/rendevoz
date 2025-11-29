import { AIService } from '@/api/services'
import z from 'zod'

const getPrompt = (content: string, lang: string) => {
  return `
Please convert the following document into a summarized and analyzed Markmap structure.
The process should include:
1. Summarizing and analyzing the subtitles to extract the main points.
2. Creating a Markmap structure based on these main points.
3. Use language ${lang} only.
The desired Markmap output should look like this:

# Summary
- Introduction
  - Introduction 1.
  - Introduction 2.
- Main Topic
  - Topic 1.
  - Topic 2
Please generate a similar summarized and analyzed Markmap for the provided document, ensuring the main points are clearly highlighted.
Here is the transcription data:
${content}
`
}

export default async (content: string, lang: string) => {
  const prompt = getPrompt(content, lang)
  const res = await AIService.chatStructured<string>(prompt, {
    schema: z.string()
  })
  return res
}
