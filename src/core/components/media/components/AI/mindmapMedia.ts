import JSON5 from 'json5'
import { AIService } from '@/api/services'
import z from 'zod'

const getPrompt = (content: { text: string }[], lang: string) => {
  return `
Please convert the following JSON-formatted subtitles into a summarized and analyzed Markmap structure.
Example input:
[
  {"text": "Welcome to the tutorial."},
  {"text": "In this session, we will cover the basics."},
  {"text": "Let's start with the first topic."}
]
The process should include:
1. Summarizing and analyzing the subtitles to extract the main points.
2. Creating a Markmap structure based on these main points.
3. Ensuring that each child node logically follows from its parent node, providing clear connections and context.
4. Use language ${lang} only.
The desired Markmap output should look like this:

# Summary
- Introduction
  - Welcome to the tutorial.
  - In this session, we will cover the basics, where we'll discuss important concepts.
- Main Topic
  - Let's start with the first topic, which is foundational to understanding the rest of the content.
Please generate a similar summarized and analyzed Markmap for the provided subtitles, ensuring the main points are clearly highlighted.
Here is the transcription data:
${JSON5.stringify(content)}
`
}

export default async (content: { text: string }[], lang: string) => {
  const prompt = getPrompt(content, lang)
  const res = await AIService.chatStructured<string>(prompt, { schema: z.string() })
  return res
}
