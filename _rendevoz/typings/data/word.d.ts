export type IWord = {
  pronunciation: string
  meanings: {
    partOfSpeech: string
    definition: string
    example: string
  }
  grammaticalVariations: string[]
  differencesWithSimilar: {
    word: string
    difference: string
  }
}
