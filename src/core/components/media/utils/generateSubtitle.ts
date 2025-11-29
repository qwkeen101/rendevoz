import { IMediaInstance } from '~/typings'
import { AIService } from '@/api/services'

type ISubtitleGeneratorEvent =
  | {
      type: 'startCompressing'
    }
  | {
      type: 'startTranscribing'
    }
  | {
      type: 'startDownloading'
    }
function getAudioType(uint8Array: Uint8Array) {
  const header = Array.from(uint8Array.slice(0, 12))
  const headerStr = String.fromCharCode.apply(null, header)

  if (headerStr.startsWith('fLaC')) {
    return 'flac'
  } else if (headerStr.startsWith('ID3') || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0)) {
    return 'mp3'
  } else if (headerStr.includes('ftyp')) {
    if (headerStr.includes('M4A') || headerStr.includes('m4a')) {
      return 'm4a'
    } else {
      return 'mp4'
    }
  } else if (headerStr.startsWith('OggS')) {
    return 'ogg'
  } else if (headerStr.includes('RIFF') && headerStr.includes('WAVE')) {
    return 'wav'
  } else if (headerStr.startsWith('\x1aE\xdf\xa3')) {
    return 'webm'
  } else if (headerStr.includes('MPEG')) {
    return 'mpeg'
  } else if (headerStr.includes('MPGA')) {
    return 'mpga'
  }
}

export default async (
  url: string | Blob,
  model: 'general' | 'small' | 'existing',
  onProgress?: (e: ISubtitleGeneratorEvent) => void,
  onError?: (message?: string) => void,
  instance?: IMediaInstance
) => {
  const controller = new AbortController()
  if (instance) {
    instance.cancelTranscribe = () => {
      controller.abort()
      onError?.()
    }
  }
  if (typeof url === 'string') {
    onProgress?.({ type: 'startTranscribing' })
    try {
      const res = await AIService.transcribe(url, {
        signal: controller.signal,
        model
      })
      return res.segments
    } catch (e) {
      if (typeof e === 'string') {
        console.log(e)
        onError?.(e)
        return
      }
      if (e && typeof e === 'object' && 'name' in e && e.name !== 'AbortError') {
        console.error(e)
        onError?.('Failed to transcribe with OpenAI whisper!')
        return
      }
      onError?.()
      return
    }
  }
  try {
    const file = url
    const audioType = getAudioType(new Uint8Array(await file.arrayBuffer()))
    if (!audioType) {
      onError?.('Failed to transcribe with OpenAI whisper!')
      return
    }
    try {
      onProgress?.({ type: 'startTranscribing' })
      const res = await AIService.transcribe(new Uint8Array(await file.arrayBuffer()), {
        signal: controller.signal,
        name: `1.${audioType}`
      })
      return res.segments
    } catch (e) {
      console.log(e)
      if (typeof e === 'string') {
        onError?.(e)
        return
      }
      if (e && typeof e === 'object' && 'name' in e && e.name !== 'AbortError') {
        onError?.('Failed to transcribe with OpenAI whisper!')
        return
      }
      onError?.()
    }
  } catch {
    onError?.('Failed to download file!')
  }
}
