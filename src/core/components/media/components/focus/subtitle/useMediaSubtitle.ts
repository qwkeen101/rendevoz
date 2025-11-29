import { useSelectMediaState } from '@/core/components/media/hooks/useMediaState'
import { useMemo } from 'react'
import { isEqual } from 'lodash'
import useSubtitleSelectAsLabel from '@/core/components/media/hooks/useSubtitleSelectAsLabel'
import useRenderSubtitleLabel from '@/core/components/media/components/focus/subtitle/useRenderSubtitleLabel'

export default () => {
  const { subtitles, currentTime } = useSelectMediaState(
    s => ({
      subtitles: s.subtitles,
      subtitleLang: s.subtitleLang,
      currentTime: s.currentTime
    }),
    isEqual
  )
  const highlighted = useRenderSubtitleLabel(subtitles)
  const { containerRef, renderPopover } = useSubtitleSelectAsLabel(subtitles)

  const { currentSubtitle, currentSubtitleIndex } = useMemo(() => {
    if (!subtitles) {
      return {
        currentSubtitle: undefined,
        currentSubtitleIndex: -1
      }
    }
    const index = highlighted.findLastIndex(i => (currentTime ?? 0) >= i.start)
    return {
      currentSubtitle: highlighted[index],
      currentSubtitleIndex: index
    }
  }, [currentTime, subtitles])

  return {
    currentSubtitle,
    subtitles,
    highlighted,
    containerRef,
    renderPopover,
    currentSubtitleIndex
  }
}
