export const normalizeTranslateResult = (result: { orig: string; trans: string }[]) => {
  const reg = new RegExp('[\u3002\uff1b\uff0c\uff1a\u201c\u201d\u3001\uff1f\u300a\u300b]')
  const data = result
    .map(i => {
      const trans = i.trans.trim()
      const endChar = trans[trans.length - 1]
      // if end char is any of the punc, split it
      if (reg.test(endChar)) {
        i.trans += '\r\n'
      }
      return i
    })
    .reduce(
      (whole, curr) => {
        const wholelast = whole[whole.length - 1]
        const doubleQuotesReg = new RegExp(/“.*?”/gm)
        if (wholelast) {
          const removedWhole = wholelast.trans.replaceAll('\r\n', '').trim()
          const removedCurr = curr.trans.replaceAll('\r\n', '').trim()
          const hasDoubleQuote = doubleQuotesReg.test(removedWhole)

          if (
            !hasDoubleQuote &&
            removedWhole.includes('\u201c') &&
            !removedWhole.endsWith('\u201d') &&
            !removedWhole.endsWith('\u201c') &&
            !removedWhole.includes('{xxx}')
          ) {
            wholelast.orig += '' + curr.orig
            wholelast.trans += '' + removedCurr
            if (removedCurr.includes('\u201d')) {
              wholelast.trans += '{xxx}\r\n'
            }
            return whole
          }

          if (!wholelast.trans.endsWith('\r\n')) {
            wholelast.orig += ' ' + curr.orig
            wholelast.trans += ' ' + curr.trans
            return whole
          }
        }
        whole.push(curr)
        return whole
      },
      [] as {
        trans: string
        orig: string
      }[]
    )
    .map(i => ({
      ...i,
      trans: i.trans.replaceAll('{xxx}', '')
    }))
  return data
}
