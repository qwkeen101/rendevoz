import { splitBySentence } from './stringSegmenter'

// --------------------
// -- Normalize Text --
// --------------------
function normalizeText(text: string, { observeMultipleLineBreaks = false, removeStartLineSequences = [] } = {}) {
  // Remove specified characters from start of each line
  for (const sequence of removeStartLineSequences) {
    text = text
      .split('\n')
      .map(line => (line.startsWith(sequence) ? line.slice(sequence.length) : line))
      .join('\n')
  }

  if (observeMultipleLineBreaks) {
    // replace a single line (not following a line break) with a space
    text = text.replace(/\n(?!\n)/g, ' ').trim()
    //replace two or more line breaks with a single line break
    text = text.replace(/\n\n+/g, '\n').trim()
    // replace multiple white space characters on the same line with a single space
    text = text.replace(/[ \t]+/g, ' ')
  } else {
    // replace all whitespace with a single space
    text = text.replace(/\s+/g, ' ').trim()
  }
  return text
}

// ---------------------
// -- Parse Sentences --
// ---------------------
export async function parseSentences(
  text: string,
  { observeMultipleLineBreaks = false, removeStartLineSequences = [], excludeNonLetterSentences = false } = {}
) {
  text = normalizeText(text, { observeMultipleLineBreaks, removeStartLineSequences })
  const sentences = []

  for (const { segment } of splitBySentence(text)) {
    if (excludeNonLetterSentences && segment.match(/^\P{L}*$/u)) continue // skip segments that contain NO letters
    sentences.push(segment.trim())
  }

  return sentences
}
