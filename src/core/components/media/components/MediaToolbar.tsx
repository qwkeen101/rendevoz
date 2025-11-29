import useMediaState, { useSetMediaState } from '@/core/components/media/hooks/useMediaState'
import { Button, Content, Icon, IconWithPopover } from '@/components'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { Colors, Icons } from '@/consts'
import { useTranslation } from 'react-i18next'
import MediaSubtitleImporter from '@/core/components/media/components/MediaSubtitleImporter'
import { CSSProperties } from 'react'
import classnames from 'classnames'
import useMediaTranscribe from '@/core/components/media/hooks/useMediaTranscribe'
import { ObjectStore } from '@/api/stores'
import { useAtomValue } from 'jotai'
import trans from '@/consts/trans'
import MediaMoreMenu from '@/core/components/media/components/MediaMoreMenu'

const shortenClazz = '!rounded-3xl has-bg-button font-medium !h-[36px] !px-4 items-center select-none cursor-pointer'
const clazz = '!rounded-3xl !pr-4 !pl-3.5 py-2 !h-9 items-center select-none cursor-pointer'
export default ({ style, className }: { style?: CSSProperties; className?: string }) => {
  const [mediaState, setMediaState] = useMediaState()
  const instance = useMediaInstance()
  const { t } = useTranslation()
  const canHighlight = mediaState.currentTime !== undefined && mediaState.loaded
  const validSubtitleIcon = mediaState.subtitleList?.length
  const episodeMode = mediaState.layout?.episodeMode
  const canTranscribe = useAtomValue(useMediaTranscribe.canTranscribeAtom)
  const hasTranscript = useAtomValue(useMediaTranscribe.hasTranscriptAtom)
  const { state, subtitleImporterVisible } = mediaState
  const [transcribeState] = useMediaTranscribe()
  const noSubtitleButCanTranscribe = canTranscribe && !validSubtitleIcon
  const noSubtitleButHasTranscript = hasTranscript && !validSubtitleIcon
  if (mediaState.toolbar?.toolbarEnabled === false) return null
  return (
    <Content style={style} className={classnames(className, '@container')} flex fullWidth alignItems={'center'} gap={30}>
      <MediaSubtitleImporter
        visible={subtitleImporterVisible === true}
        onChange={() => setMediaState(s => ({ ...s, subtitleImporterVisible: false }))}
      />
      <div className={'flex-wrap items-center gap-3 flex'}>
        {state?.ytChannelId && <ChannelRenderer id={state.ytChannelId} />}
        {episodeMode && (
          <Button.IconButton
            strokeWidth={6}
            smallText={false}
            icon={state?.isPlaying ? 'park-pause' : 'park-play-one'}
            className={classnames(shortenClazz, 'reverse-theme-button')}
            size={18}
            theme={'filled'}
            onClick={() => {
              instance.on?.({ type: 'audioPlayButtonClicked' })
            }}
            text={state?.isPlaying ? t('general.Pause') : t('general.Play')}
          ></Button.IconButton>
        )}
        {!episodeMode && (
          <Button.IconButton
            smallText={false}
            icon='park-high-light'
            className={shortenClazz}
            size={18}
            style={{
              color: !canHighlight ? Colors.Font.SuperTransparent : undefined,
              cursor: !canHighlight ? 'not-allowed' : 'pointer'
            }}
            onClick={() => {
              if (canHighlight) {
                instance.insertLabel?.({
                  time: mediaState.currentTime
                })
              }
            }}
            text={t('general.Media highlight')}
          ></Button.IconButton>
        )}
        <Button.IconButton
          size={18}
          smallText={false}
          text={
            noSubtitleButHasTranscript
              ? t('media.Transcript available')
              : noSubtitleButCanTranscribe
                ? transcribeState.state
                  ? t('media.Transcribing')
                  : t('media.Transcribe')
                : t('general.Subtitles')
          }
          icon={noSubtitleButCanTranscribe && transcribeState.state ? Icons.Loading : 'custom-CC'}
          style={{
            ...(validSubtitleIcon || noSubtitleButCanTranscribe || noSubtitleButHasTranscript
              ? {}
              : {
                  color: Colors.Font.SuperTransparent
                })
          }}
          spin={!!(noSubtitleButCanTranscribe && transcribeState.state)}
          className={classnames(
            shortenClazz,
            noSubtitleButHasTranscript && 'select-color-border select-color-font',
            noSubtitleButCanTranscribe && transcribeState.state && 'active-button select-color-border'
          )}
          onClick={() => {
            if (mediaState.subtitleList?.length) {
              setMediaState(s => ({
                ...s,
                sidebarActive: 'subtitles',
                sidebarVisible: s.sidebarActive === 'subtitles' && s.sidebarVisible ? false : true
              }))
            } else if (!validSubtitleIcon) {
              setMediaState(s => ({ ...s, subtitleImporterVisible: true }))
            }
          }}
        ></Button.IconButton>
        <Button.IconButton
          smallText={false}
          icon='custom-stars'
          className={shortenClazz}
          size={18}
          onClick={() => {
            setMediaState(s => ({ ...s, sidebarActive: 'ai', sidebarVisible: s.sidebarActive === 'ai' && s.sidebarVisible ? false : true }))
          }}
          text={t('general.Chat')}
        ></Button.IconButton>
        {validSubtitleIcon && transcribeState.state && (
          <Button.IconButton
            className={clazz}
            text={t('media.Transcribing')}
            size={14}
            onClick={() => {
              setMediaState(s => ({ ...s, subtitleImporterVisible: true }))
            }}
            spin={true}
            icon={Icons.Loading}
          />
        )}
        <Icon
          size={18}
          onClick={() => {
            setMediaState(s => ({ ...s, sidebarVisible: !s.sidebarVisible }))
          }}
          className={classnames('!w-[36px]', shortenClazz)}
          name='custom-right-bar'
        />
        <IconWithPopover
          name={Icons.More}
          size={20}
          placement={['bottom', 'top']}
          className={classnames(shortenClazz, '!w-[36px]')}
          content={setV => <MediaMoreMenu onClose={() => setV(false)} />}
        ></IconWithPopover>
      </div>
    </Content>
  )
}

const ChannelRenderer = ({ id }: { id: number }) => {
  const channel = ObjectStore('youtubeChannel').useValue(id)
  const { t } = useTranslation()
  if (channel) {
    return (
      <div
        onClick={() => {
          Global.layoutOps?.openPage('youtube').then(i => {
            i.goTo?.(id, 'channel')
          })
        }}
        className={'flex gap-3 mr-4 cursor-pointer items-center'}
      >
        <img src={channel.thumbnail} className={'size-12 rounded-full object-cover'} />
        <div>
          <div style={{ maxWidth: '25cqw' }} className={'font-semibold break-all line-clamp-1 text-lg'}>
            {channel.name}
          </div>
          {channel.subscriberCount ? (
            <div className={'small-transparent'}>
              {t('feed.SubscriberCount', {
                count: new Intl.NumberFormat(undefined, {
                  compactDisplay: 'short',
                  notation: 'compact'
                }).format(Number(channel.subscriberCount))
              })}
            </div>
          ) : null}
        </div>
      </div>
    )
  }
}
