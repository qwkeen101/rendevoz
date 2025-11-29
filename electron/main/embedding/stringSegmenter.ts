import abbv from './en-abbv.json'

const DEFAULT_SEGMENTER = {
  abbreviations: new Set(abbv),
  segmenter: new Intl.Segmenter('en', { granularity: 'sentence' })
}

/**
 * Split a string into sentences, respecting common abbreviations.
 */
export function* splitBySentence(rawInput: string, locale: Intl.LocalesArgument = 'en'): Generator<Intl.SegmentData> {
  if (!rawInput) return
  if (typeof rawInput !== 'string') throw new TypeError('input must be a string')
  const { abbreviations, segmenter } = DEFAULT_SEGMENTER
  const rLastWord = /(?<=\s|^)\S+(?=\s+$)/
  const input = rawInput.replaceAll(/(?<=\.\s+)\S/g, char => char.toLocaleUpperCase())

  let left = 0
  for (const { segment, index } of segmenter.segment(input)) {
    const match = segment.match(rLastWord)

    if (
      match &&
      // 1. The last word is an abbreviation.
      (abbreviations.has(match[0].toLocaleLowerCase(locale)) ||
        // 2. A closing parenthesis without a period.
        match[0].endsWith(')'))
    )
      continue

    const right = index + segment.length
    yield {
      segment: rawInput.slice(left, right),
      index: left,
      input: rawInput
    }

    left = right
  }
}
