import { memo } from 'react'

const getPrompt = (query: string, language: string) => {
  return `For the word "${query}", return a JSON object with the following fields and in language ${language}: 
{
  "pronunciation": "IPA transcription of the word",
  "meanings": [
    {
      "partOfSpeech": "Part of speech in native language (e.g., 动词, verb)",
      "definition": "Definition of the word in this form",
      "example": "Example sentence"
    }   
  ],
  "grammaticalVariations": ["variation 1", "variation 2"],
  "differencesWithSimilar": {
    "word": "[similar word]",
    "difference": "Explain the difference in meaning, tone, or usage"
  },
  "questions": [
    "Generate 3–5 specific and relevant questions a language learner might ask about this word. These questions should vary based on the word's actual usage, nuance, cultural context, or grammar."
  ]
}
`
}

export default memo(() => {
  return <div></div>
})
