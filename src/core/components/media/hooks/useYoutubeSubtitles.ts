import { useEffect, useState } from 'react'
import youtubeCaptionScrapper, { YoutubeCaptionParser } from '@/core/components/media/utils/youtubeCaptionScrapper'
import { useGetMediaState, useSelectMediaState, useSetMediaState } from '@/core/components/media/hooks/useMediaState'
import { IMediaSubtitle } from '~/typings'
import TranslateService from '@/api/services/translate.service'
import produce from 'immer'
import useFocusSettings from '../components/focus/useFocusSettings'

function mergeCues(
  cues: IMediaSubtitle[],
  {
    maxGap = 1.2, // 最大可接受间隔秒
    maxDur = 20, // 每段最长秒数
    maxChars = 180, // 每段最长字符
    punctuations = /[.!?。！？…]+["']?$/, // 判断句末标点
    fixPunctuation = false // 是否自动补句点
  } = {}
) {
  if (!cues?.length) return []
  const result = []
  let cur = { ...cues[0] }

  const endsWithPunc = text => punctuations.test(text.trim())
  const isCapStart = text => /^[A-Z][a-z]/.test(text.trim())

  const maybeFixPunc = text => {
    return endsWithPunc(text) ? text : text + (/[a-zA-Z]/.test(text) ? '.' : '。')
  }

  const push = () => {
    if (fixPunctuation && !endsWithPunc(cur.text)) {
      cur.text = maybeFixPunc(cur.text)
    }
    result.push({ ...cur, id: result.length + 1 })
  }

  for (let i = 1; i < cues.length; i++) {
    const next = cues[i]
    const gap = next.start - cur.end
    const curText = cur.text
    const nextText = next.text

    const willBeTooLong = cur.text.length + 1 + next.text.length > maxChars || Math.max(cur.end, next.end) - cur.start > maxDur

    const shouldSplit =
      endsWithPunc(curText) || // 句号结尾
      gap > maxGap || // 时间断点
      isCapStart(nextText) || // 新句首大写
      willBeTooLong

    if (shouldSplit) {
      push()
      cur = { ...next }
    } else {
      cur.end = Math.max(cur.end, next.end)
      cur.text = (cur.text + ' ' + next.text).replace(/\s{2,}/g, ' ')
    }
  }

  push()
  return result.map((i, idx) => ({ ...i, id: idx }))
}

export default (url: string) => {
  const currentLang = useSelectMediaState(s => s.subtitleLang)
  const subtitleList = useSelectMediaState(s => s.subtitleList)
  const getState = useGetMediaState()
  const setMediaState = useSetMediaState()
  const [translateTask, setTranslateTask] = useState<{
    lang: string
    target: string
    range: {
      start: number
      end: number
    }
    retry?: number
  }>()

  const setting = useFocusSettings()[0]

  const fetchYoutubeCaptions = async (url: string) => {
    const u = new URL(url)
    u.searchParams.set('fmt', 'srt')
    const text = await fetch(u.toString()).then(res => res.text())
    const data = mergeCues(YoutubeCaptionParser(text))
    return data
  }

  useEffect(() => {
    if (url?.includes('youtube')) {
      youtubeCaptionScrapper(url.split('embed/')[1].split('?')[0]).then(async res => {
        const first = res.find(i => i.languageCode === 'en') || res[0]
        if (first) {
          const url = first.baseUrl
          const data = await fetchYoutubeCaptions(url)
          setMediaState(s => ({
            ...s,
            subtitles: data,
            subtitleLang: first.name.simpleText,
            subtitleList: [
              ...(s.subtitleList || []),
              ...res.map(i => ({
                code: i.languageCode,
                lang: i.name.simpleText,
                value: i.name.simpleText === first.name.simpleText ? data : undefined,
                url: i.baseUrl
              }))
            ]
          }))
        }
      })
    }
  }, [url])

  const TRANSLATE_RANGE = 3

  useEffect(() => {
    setMediaState(s => ({
      ...s,
      subtitleList: s.subtitleList?.map(i => ({ ...i, value: i.value?.map(o => ({ ...o, translation: undefined })) }))
    }))
  }, [setting.targetTranslate])

  useEffect(() => {
    const state = getState()
    const targetValue = state.subtitleList?.find(i => i.lang === currentLang)
    if (currentLang && targetValue) {
      if (targetValue.code === setting.targetTranslate) {
        setTranslateTask(undefined)
        return
      }
      const value = targetValue.value
      if (value) {
        const noTranslation = value.findIndex(i => !i.translation)
        // all subtitles are translated
        if (noTranslation === -1) return
        const shouldTranslate = {
          start: noTranslation,
          end: noTranslation + TRANSLATE_RANGE
        }
        setTranslateTask({
          lang: currentLang,
          range: shouldTranslate,
          target: setting.targetTranslate
        })
      }
    }
  }, [currentLang, subtitleList])

  useEffect(() => {
    const current = subtitleList?.find(i => i.lang === currentLang)
    if (current?.value !== getState().subtitles) {
      setMediaState(s => ({ ...s, subtitles: current?.value }))
      return
    }
    if (!current?.value && current?.url && currentLang) {
      fetchYoutubeCaptions(current.url).then(data => {
        setMediaState(s =>
          produce(s, draft => {
            const value = draft.subtitleList?.find(i => i.lang === currentLang)
            if (value) {
              value.value = data
            }
            if (s.subtitleLang === currentLang) {
              s.subtitles = data
            }
          })
        )
      })
    }
  }, [subtitleList, currentLang])

  // batch translate in effect, auto stop when unmount
  useEffect(() => {
    if (translateTask && (translateTask.retry ?? 0) < 3) {
      const shouldTranslateSubtitles = getState()
        .subtitleList?.find(i => i.lang === translateTask.lang)
        ?.value?.slice(translateTask.range.start, translateTask.range.end)
      if (shouldTranslateSubtitles?.length) {
        Promise.all(
          shouldTranslateSubtitles.map(async (i, idx) => ({
            translation: await TranslateService.freeTranslateText(i.text, {
              target: translateTask.target
            }),
            index: translateTask.range.start + idx,
            text: i.text
          }))
        )
          .then(res => {
            console.log(res)
            setMediaState(s =>
              produce(s, draft => {
                const v = draft.subtitleList?.find(i => i.lang === translateTask.lang)?.value
                if (v) {
                  res.forEach(i => {
                    v[i.index].translation = i.translation
                  })
                }
              })
            )
            setTranslateTask(s =>
              s === translateTask
                ? {
                    ...s,
                    lang: translateTask.lang,
                    range: {
                      start: translateTask.range.end,
                      end: translateTask.range.end + TRANSLATE_RANGE
                    },
                    retry: -1
                  }
                : s
            )
          })
          .catch(() => {
            setTranslateTask(s => (s === translateTask ? { ...s, retry: (s.retry ?? -1) + 1 } : s))
          })
      }
    }
  }, [translateTask])
}
