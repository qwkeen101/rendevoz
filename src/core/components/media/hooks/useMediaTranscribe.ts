import { atom } from 'jotai/index'
import { useAtom, useStore } from 'jotai'
import generateSubtitle from '@/core/components/media/utils/generateSubtitle'
import { toast } from 'react-hot-toast'
import { t } from 'i18next'
import { MediaInstanceAtom } from '@/core/components/media/hooks/useMediaInstance'
import { WebVTTSerializer } from 'webvtt-parser'
import { MediaStateAtom } from '@/core/components/media/hooks/useMediaState'
type ITranscribeState = {
  state?: 'downloading' | 'compressing' | 'transcribing'
}
const TranscribeStateAtom = atom<ITranscribeState>({})
const CanTranscribeStateAtom = atom(false)
const HasTranscriptAtom = atom(false)
const defaultCueSettings = {
  direction: 'horizontal',
  snapToLines: true,
  linePosition: 'auto',
  lineAlign: 'start',
  textPosition: 'auto',
  positionAlign: 'auto',
  size: 100,
  alignment: 'center'
}
const useTranscribeState = () => useAtom(TranscribeStateAtom)
const transcribeWithOpenAI = async (url: string, store: ReturnType<typeof useStore>, model: 'general' | 'small' | 'existing') => {
  const instance = store.get(MediaInstanceAtom)
  const res = await generateSubtitle(
    url,
    model,
    e => {
      const currTran = store.get(TranscribeStateAtom)
      switch (e.type) {
        case 'startCompressing': {
          store.set(TranscribeStateAtom, { ...currTran, state: 'compressing' })
          break
        }
        case 'startDownloading': {
          store.set(TranscribeStateAtom, { ...currTran, state: 'downloading' })
          break
        }
        case 'startTranscribing': {
          store.set(TranscribeStateAtom, { ...currTran, state: 'transcribing' })
          break
        }
      }
    },
    e => {
      if (e) {
        toast.error(t(e))
      }
      store.set(TranscribeStateAtom, { ...store.get(TranscribeStateAtom), state: undefined })
    },
    instance
  )
  if (res) {
    const seri = new WebVTTSerializer()
    const tree = seri.serialize(
      // @ts-ignore
      res.map(i => ({
        ...defaultCueSettings,
        startTime: i.start,
        endTime: i.end,
        tree: {
          children: [
            {
              type: 'text',
              value: i.text
            }
          ]
        }
      }))
    )
    store.set(TranscribeStateAtom, { ...store.get(TranscribeStateAtom), state: undefined })
    store.set(MediaStateAtom, {
      ...store.get(MediaStateAtom),
      sidebarActive: 'subtitles',
      sidebarVisible: true,
      subtitleImporterVisible: false
    })
    instance.on?.({
      type: 'transcribeFinished',
      vttText: new Blob([tree])
    })
  }
}
function generateNewName(baseName: string, existingNames: string[]) {
  if (!existingNames.includes(baseName)) {
    return baseName
  }
  let suffix = 1
  while (existingNames.includes(`${baseName}(${suffix})`)) {
    suffix++
  }
  return `${baseName}(${suffix})`
}

useTranscribeState.transcribeWithOpenAI = transcribeWithOpenAI
useTranscribeState.atom = TranscribeStateAtom
useTranscribeState.generateNewName = generateNewName
useTranscribeState.canTranscribeAtom = CanTranscribeStateAtom
useTranscribeState.hasTranscriptAtom = HasTranscriptAtom
export default useTranscribeState as typeof useTranscribeState & {
  transcribeWithOpenAI: typeof transcribeWithOpenAI
  atom: typeof TranscribeStateAtom
  generateNewName: typeof generateNewName
  canTranscribeAtom: typeof CanTranscribeStateAtom
  hasTranscriptAtom: typeof HasTranscriptAtom
}
