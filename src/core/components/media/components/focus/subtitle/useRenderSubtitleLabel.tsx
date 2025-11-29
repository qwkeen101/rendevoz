// 把subtitle中被标注的文本替换为<span class="highlight" id="id">...</span>

import { useSelectMediaState } from '@/core/components/media/hooks/useMediaState'
import { isEqual } from 'lodash'
import { ObjectStore } from '@/api/stores'
import { IMediaLabel, IMediaSubtitle } from '~/typings'
import { useMemo } from 'react'

function segmentWithTokenSpan(html: string, segmenter: Intl.Segmenter): string {
  // 用正则切分成标签或纯文本
  const parts = html.split(/(<[^>]+>)/g)

  return parts
    .map(part => {
      if (part.startsWith('<')) {
        // 是标签，直接返回
        return part
      }
      // 是纯文本，做分词+包裹
      const segments = segmenter.segment(part)
      let res = ''
      for (const { segment } of segments) {
        if (segment.trim() === '') {
          // 空白字符保持原样
          res += segment
        } else {
          res += `<span class="token">${segment}</span>`
        }
      }
      return res
    })
    .join('')
}

function markHighlightsWithToken<T extends { text: string }>(pieces: T[], hlArr: { highlight: string }[]): T[] {
  if (!pieces.length || !hlArr.length) return pieces.map(p => ({ ...p }))

  // 你的markHighlights核心逻辑（略，和你的一样）
  const offsets: number[] = []
  let concat = ''
  for (const { text } of pieces) {
    offsets.push(concat.length)
    concat += text
  }

  const raw: Array<[number, number]> = []
  for (const { highlight } of hlArr) {
    if (!highlight) continue
    const re = new RegExp(highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    let m: RegExpExecArray | null
    while ((m = re.exec(concat))) raw.push([m.index, m.index + m[0].length])
  }
  if (!raw.length) return pieces.map(p => ({ ...p }))

  raw.sort(([a], [b]) => a - b)
  const ranges: Array<[number, number]> = []
  let [cs, ce] = raw[0]
  for (let i = 1; i < raw.length; i++) {
    const [s, e] = raw[i]
    if (s <= ce) ce = Math.max(ce, e)
    else {
      ranges.push([cs, ce])
      ;[cs, ce] = [s, e]
    }
  }
  ranges.push([cs, ce])

  // 创建分词器
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' })

  // 对每段文字先生成高亮html，然后再做分词包裹token
  const result: T[] = []
  for (let i = 0; i < pieces.length; i++) {
    const start = offsets[i]
    const end = i + 1 < offsets.length ? offsets[i + 1] : concat.length
    let cur = start,
      buf = ''

    for (const [s, e] of ranges) {
      if (e <= cur || s >= end) continue
      if (s > cur) buf += concat.slice(cur, s)
      buf += '<span class="label-underline">' + concat.slice(Math.max(s, start), Math.min(e, end)) + '</span>'
      cur = Math.min(e, end)
    }
    buf += concat.slice(cur, end)

    // 这里对buf调用分词包裹token的函数
    const segmented = segmentWithTokenSpan(buf, segmenter)

    result.push({ ...pieces[i], text: segmented })
  }

  return result
}

export default (subtitles?: IMediaSubtitle[]) => {
  const { labels, type } = useSelectMediaState(
    s => ({
      type: s.labelType,
      labels: s.labels
    }),
    isEqual
  )

  const items = ObjectStore(type).useMultiple(labels) as IMediaLabel[]

  const highlighted = useMemo(
    () =>
      subtitles
        ? markHighlightsWithToken(
            subtitles,
            items.map(i => ({ highlight: i.selectedText ?? '' }))
          )
        : [],
    [items, subtitles]
  )

  return highlighted
}
