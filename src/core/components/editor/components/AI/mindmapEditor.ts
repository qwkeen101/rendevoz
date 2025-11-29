import JSON5 from 'json5'
import { AIService } from '@/api/services'

const getPrompt = (content: { text: string }[], lang: string) => {
  return `
Please convert the following JSON-formatted subtitles into a summarized and analyzed Markmap structure. The JSON format is as follows: {"text": string}[].

Example input:

[
  {"text": "Welcome to the tutorial."},
  {"text": "In this session, we will cover the basics."},
  {"text": "Let's start with the first topic."}
]
The process should include:

1. Summarizing and analyzing the subtitles to extract the main points.
2. Creating a Markmap structure based on these main points.
The desired Markmap output should look like this:

# Summary
- Introduction
  - Welcome to the tutorial.
  - In this session, we will cover the basics.
- Main Topic
  - Let's start with the first topic.
Please generate a similar summarized and analyzed Markmap for the provided subtitles, ensuring the main points are clearly highlighted.

Return in JSON format: {
  "document": generated markmap string
} and use ${lang} only.
Here is the transcription data:
${JSON5.stringify(content)}
`
}

export default async (content: { text: string }[], lang: string) => {
  const prompt = getPrompt(content, lang)
  const res = await AIService.ask<{
    document: string
  }>(prompt)
  return res.document
}
