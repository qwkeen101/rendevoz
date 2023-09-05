import { useSelectAtomValue } from '@/hooks'
import { VideoStateAtom } from '@/core/video/hooks/useVideoState'
import { Content, Icon, Tooltip, VirtualList } from '@/components'
import { useVideoInstance } from '@/core/video/hooks/useVideoInstance'
import { normalizeSecondsToTime } from '@/core/video/utils'
import { ClassName } from 'rendevoz'
import { memo, useState } from 'react'
import FontSize from '@/consts/font'
import Colors from '../../consts/colors'
import { useTranslation } from 'react-i18next'
import { Resizable } from 're-resizable'
import { useAtom } from 'jotai'
import { VideoSidebarStateAtom } from '@/core/video/hooks/useVideoSidebarState'
const VideoSubtitleSidebar = memo(({ small }: { small: boolean }) => {
  const subtitles = useSelectAtomValue(VideoStateAtom, s => s.subtitles) || []
  const { t } = useTranslation()
  const [sidebarState, setSidebarState] = useAtom(VideoSidebarStateAtom)

  if (!subtitles.length) return null
  return (
    <Resizable
      style={{
        border: `1px solid ${Colors.Background.Border}`,
        borderRadius: 10,
        overflow: 'hidden',
        maxHeight: '100%',
        display: 'flex',
        contentVisibility: sidebarState.showSubtitles ? 'visible' : 'hidden',
        position: sidebarState.showSubtitles ? 'relative' : 'absolute',
        opacity: sidebarState.showSubtitles ? 1 : 0,
        pointerEvents: sidebarState.showSubtitles ? 'auto' : 'none',
        flexDirection: 'column',
        marginBottom: small ? 30 : 0
      }}
      minWidth={250}
      maxWidth={small ? '100%' : 550}
      defaultSize={{
        width: small ? '100%' : 400,
        height: small ? '500px' : 'auto'
      }}
      enable={{
        right: small ? false : true,
        bottom: small ? true : false
      }}
    >
      <Content
        style={{
          padding: '6px 20px 6px 16px',
          background: Colors.Background.ButtonHover
        }}
        flex
        fullWidth
        alignItems="center"
        justifyContent="space-between"
      >
        <div className={ClassName.title(FontSize['18px'])}>{t('general.subtitles')}</div>

        <Icon
          name="park-close"
          className={ClassName.circleButton()}
          onClick={() => setSidebarState(s => ({ ...s, showSubtitles: false }))}
        ></Icon>
      </Content>
      <VirtualList
        style={{ width: '100%', height: '100%', padding: '6px 4px' }}
        estimateSize={40}
        items={subtitles}
        renderItem={s => <SubtitleItem subtitle={s} key={s.id} />}
      />
    </Resizable>
  )
})

const SubtitleItem = ({ subtitle }: { subtitle: any }) => {
  const instance = useVideoInstance()
  const [hovered, setHovered] = useState(false)
  return (
    <Content
      flex
      justifyContent="space-between"
      className={ClassName.flatButton()}
      onPointerLeave={() => setHovered(false)}
      onPointerMove={() => setHovered(true)}
      onClick={() => {
        instance.jumpTo?.(subtitle.startTime)
      }}
      alignItems="center"
    >
      <Content>
        <div className={ClassName.description(FontSize['12px'])}>{normalizeSecondsToTime(subtitle.startTime)}</div>
        <div style={{ userSelect: 'text' }}>{subtitle.text}</div>
      </Content>
      <Tooltip content={'Add as label'}>
        <Icon
          name="park-plus"
          containerStyle={{ flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.3s ease' }}
          className={ClassName.circleButton()}
          onClick={() => {
            instance.insertLabel?.(
              {
                videoTime: subtitle.startTime,
                name: subtitle.text
              },
              false
            )
          }}
        />
      </Tooltip>
    </Content>
  )
}

export default VideoSubtitleSidebar
