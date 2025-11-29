import { AnimatePopover, Icon, Modal, WithBorder } from '@/components'
import { memo, useEffect, useState } from 'react'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import { useTranslation } from 'react-i18next'
import toWebVTT from 'srt-webvtt'
import Id from '@/utils/id'
import { toast } from 'react-hot-toast'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import FileSystem from '@/api/fileSystem'
import { useAtom, useStore } from 'jotai'
import useMediaTranscribe from '@/core/components/media/hooks/useMediaTranscribe'
import { useUnmount } from 'react-use'
import UserService from '@/api/services/user.service'
import trans from '@/consts/trans'
import classnames from 'classnames'
import { AIService } from '@/api/services'

type Props = {
  visible: boolean
  onChange: VoidFunction
}
async function isValidAudioUrl(urlToCheck: string) {
  const res = await fetch(urlToCheck, { method: 'HEAD', mode: 'no-cors' })
  return res.ok && res.headers.get('content-type')?.startsWith('audio')
}
function getDuration(url: string): Promise<number> {
  return new Promise(function (resolve) {
    let audio = new Audio()
    audio.addEventListener('loadedmetadata', function () {
      resolve(audio.duration)
    })
    audio.src = url
  })
}
const MediaSubtitleImporter = memo(({ visible, onChange }: Props) => {
  const [mediaState, setState] = useMediaState()
  const { t } = useTranslation()
  const [canTranscribe, setCanTranscribe] = useAtom(useMediaTranscribe.canTranscribeAtom)
  const [hasTranscript, setHasTranscript] = useAtom(useMediaTranscribe.hasTranscriptAtom)
  const [duration, setDuration] = useState<number>()
  const store = useStore()
  const [panel, setPanel] = useState<'main' | 'local'>('main')
  const [tState] = useMediaTranscribe()
  useEffect(() => {
    setCanTranscribe(false)
  }, [mediaState.url])
  useEffect(() => {
    if (mediaState.url && !hasTranscript) {
      AIService.hasTranscript(mediaState.url).then(res => {
        setHasTranscript(res)
      })
    }
    if (!canTranscribe) {
      mediaState.url && isValidAudioUrl(mediaState.url).then(res => setCanTranscribe(!!res))
    }
  }, [mediaState.url, visible])

  useEffect(() => {
    if (mediaState.totalTime) {
      setDuration(mediaState.totalTime)
      return
    }
    if (mediaState.url) {
      getDuration(mediaState.url).then(res => setDuration(res ?? undefined))
      return
    }
    setDuration(undefined)
  }, [mediaState.url, mediaState.totalTime])
  const instance = useMediaInstance()
  const handleTranscribe = async (mode: 'general' | 'small' | 'existing') => {
    const isPro = UserService.isUserPro(true)
    if (!isPro) {
      toast.error(t(trans.FeatureNeedSubscription))
      return
    }
    if (hasTranscript && mode === 'existing') {
      useMediaTranscribe.transcribeWithOpenAI(mediaState.url, store, mode)
      setState(s => ({ ...s, subtitleImporterVisible: false }))
      return
    }
    if (canTranscribe) {
      useMediaTranscribe.transcribeWithOpenAI(mediaState.url, store, mode)
      setState(s => ({ ...s, subtitleImporterVisible: false }))
      toast.success(t(trans.Success.TranscriptionBegins))
    } else {
      Global.commonOps?.upload({ accept: 'audio/*' }).then(f => {
        const file = Array.isArray(f) ? f[0] : f
        useMediaTranscribe.transcribeWithOpenAI(file, store, mode)
        setState(s => ({ ...s, subtitleImporterVisible: false }))
        toast.success(t(trans.Success.TranscriptionBegins))
      })
    }
  }
  const handleImportSubtitle = async () => {
    const file = (await Global.commonOps?.upload()) as File
    if (file) {
      if (file.name.endsWith('srt')) {
        const vttFileUrl = await toWebVTT(file)
        const blob = await (await fetch(vttFileUrl)).blob()
        const filepath = await FileSystem.fs.writeFile(blob, `/files/subtitles_${Id.getId()}`)
        if (filepath) {
          instance.on?.({
            type: 'subtitleUpdated',
            subtitleList: [
              ...(mediaState.subtitleList || []),
              {
                lang: file.name.replace('.srt', ''),
                url: filepath
              }
            ]
          })
          toast.success(t('media.Successfully import subtitles'))
          onChange()
        }
      }
      if (file.name.endsWith('vtt')) {
        const path = await FileSystem.saveFile(file)
        instance.on?.({
          type: 'subtitleUpdated',
          subtitleList: [
            ...(mediaState.subtitleList || []),
            {
              lang: file.name.replace('.vtt', ''),
              url: path
            }
          ]
        })
        toast.success(t('media.Successfully import subtitles'))
        onChange()
        return
      }
    }
  }
  const renderDetails = () => {
    if (tState.state) {
      let text = ''
      switch (tState.state) {
        case 'compressing':
          text = t('media.Compressing file')
          break
        case 'downloading':
          text = t('media.Downloading file')
          break
        case 'transcribing':
          text = t('media.Transcribing')
          break
      }
      return (
        <>
          <div className={'flex justify-between items-center gap-24'}>
            <div>
              <div className={'flex items-center'}>
                {t('media.Transcription status')}：{text}...
              </div>
            </div>
            <div onClick={() => instance.cancelTranscribe?.()} className={'delete-button !py-1.5 !h-auto !px-4 !rounded-full'}>
              {t('general.Cancel')}
            </div>
          </div>
        </>
      )
    }
  }
  const renderMain = () => {
    if (tState.state) {
      return renderDetails()
    }
    let canTranscribeWithWhisper = false
    const isPro = UserService.isUserPro(true)
    if (isPro) {
      canTranscribeWithWhisper = true
    }
    let whipserButtonText = ''
    if (canTranscribeWithWhisper) {
      whipserButtonText = canTranscribe ? t('media.Transcribe') : t('media.Upload and transcribe')
    }
    const renderWhisper = () => {
      if (!canTranscribeWithWhisper) {
        return (
          <div className="flex gap-1.5 items-center text-sm delete-font w-fit">
            <Icon name={'park-error'} theme={'filled'} />
            <span>{t(trans.FeatureNeedSubscription)}</span>
          </div>
        )
      }
      if (!canTranscribe) {
        return (
          <div className="flex gap-1.5 items-center text-sm delete-font w-fit">
            <Icon name={'park-error'} theme={'filled'} />
            <span>{t('media.Not supported media file')}!</span>
          </div>
        )
      }
      if (duration) {
        const credit = Number((Math.floor(duration / 60) * 11.76).toFixed())
        return (
          <div className={'transparent-font text-sm'}>
            {t('general.Credit usage')}: {Math.floor(credit / 3)} ~ {credit}
          </div>
        )
      }
    }
    return (
      <div className={'flex w-[30rem] max-w-full flex-col gap-2'}>
        {hasTranscript && (
          <>
            <div className={'flex items-center justify-between'}>
              <div>{t('media.Import an existing transcript')}</div>
              <div className={'button border !py-1.5 !h-auto !px-4 !rounded-full'} onClick={() => handleTranscribe('existing')}>
                {t('general.Import')}
              </div>
            </div>
            <div className={'w-full border-bottom'}></div>
          </>
        )}
        <div className={'flex items-center justify-between'}>
          <div>
            <div>{t('media.Transcribe with OpenAI whisper')}</div>
            {renderWhisper()}
          </div>
          {whipserButtonText && (
            <AnimatePopover
              padding={4}
              containerStyle={{
                zIndex: '99999'
              }}
              positions={['bottom']}
              content={setV => (
                <WithBorder className={'p-1.5 min-w-60'}>
                  <div className={'menu-sub-title pl-2 mb-1'}>{t('media.Select one model')}</div>
                  <div
                    className={'button'}
                    onClick={() => {
                      setV(false)
                      setTimeout(() => {
                        handleTranscribe('general')
                      }, 200)
                    }}
                  >
                    {t('media.Chinese English model')}
                    <div className={'transparent-font text-xs'}>{t('media.Faster and cheaper')}</div>
                  </div>
                  <div
                    className={'button'}
                    onClick={() => {
                      setV(false)
                      setTimeout(() => {
                        handleTranscribe('small')
                      }, 200)
                    }}
                  >
                    {t('media.Other models')}
                  </div>
                </WithBorder>
              )}
            >
              <div className={'button border flex items-center gap-2 !py-1.5 !h-auto !pl-4 !pr-2.5 !rounded-full'}>
                {whipserButtonText}
                <Icon name={'park-down'} className={'transparent-font icon-14'} />
              </div>
            </AnimatePopover>
          )}
        </div>
        <div className={'w-full border-bottom'}></div>
        {/*<div className={'flex items-center justify-between'}>*/}
        {/*  <div>*/}
        {/*    <div>{t('media.Transcribe locally')}</div>*/}
        {/*    <div className={'transparent-font text-sm'}>{t('media.Transcribe with Whisper model in browser')}</div>*/}
        {/*  </div>*/}
        {/*  <div className={'button border !py-1.5 !h-auto !px-4 !rounded-full'} onClick={() => setPanel('local')}>*/}
        {/*    {t('media.Transcribe')}*/}
        {/*  </div>*/}
        {/*</div>*/}
        {/*<div className={'w-full border-bottom'}></div>*/}
        <div className={'flex items-center justify-between'}>
          <div>
            <div>{t('media.Import local subtitles')}</div>
            <div className={'transparent-font text-sm'}>{t('media.Supported subtitle formats')}</div>
          </div>
          <div className={'button border !py-1.5 !h-auto !px-4 !rounded-full'} onClick={handleImportSubtitle}>
            {t('general.Import')}
          </div>
        </div>
      </div>
    )
  }
  useUnmount(() => {
    instance.cancelTranscribe?.()
  })
  return (
    <Modal visible={visible} onClose={onChange}>
      <div className={'flex gap-2 p-6 flex-col max-w-[90vw]'}>
        <div className={classnames('flex items-center gap-3', panel === 'main' && 'mb-3')}>
          {panel !== 'main' && (
            <Icon size={16} onClick={() => setPanel('main')} name={'park-left'} className={'square-button-small !rounded-full'} />
          )}
          <div className={'text-lg font-bold'}>{t('media.Import subtitles')}</div>
        </div>
        {panel === 'main' && renderMain()}
      </div>
    </Modal>
  )
})

export default MediaSubtitleImporter
