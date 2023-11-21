import { TabPane, Tabs } from '@/components'
import MediaChapterController from './MediaChapterController'
import MediaLabelController from './MediaLabelController'
import { memo } from 'react'
import useMediaSidebarState from '../../hooks/useMediaSidebarState'
import { Resizable } from 're-resizable'
import MediaSubtitleSidebar from '@/core/components/media/components/sidebar/MediaSubtitleSidebar'
import { Colors } from '@/consts'
import { useAtomValue } from 'jotai'
import { MediaLayoutAtom } from '@/core/components/media/hooks/useVideoLayout'
import { useSelectAtomValue } from '@/hooks'
import { MediaStateAtom } from '@/core/components/media/hooks/useMediaState'
import { useTranslation } from 'react-i18next'

const MediaSidebar = memo(() => {
  const [sidebarState, setSidebarState] = useMediaSidebarState()
  const column = useAtomValue(MediaLayoutAtom)
  const labelType = useSelectAtomValue(MediaStateAtom, s => s.labelType)
  const labelIds = useSelectAtomValue(MediaStateAtom, s => s.labels)
  const { t } = useTranslation()
  return (
    <Resizable
      size={{
        height: column ? 'auto' : '100%',
        width: column ? '100%' : sidebarState.rightBarWidth
      }}
      onResizeStop={(event, direction, elementRef) => {
        const width = elementRef.clientWidth
        setSidebarState(s => ({ ...s, rightBarWidth: width }))
      }}
      onResize={(event, direction, elementRef) => {
        setSidebarState(s => ({ ...s, rightBarRealtimeWidth: elementRef.clientWidth }))
      }}
      ref={ref => {
        if (column) {
          ref?.resizable?.style.setProperty('flex-shrink', '1')
          ref?.resizable?.style.setProperty('width', 'calc(100% - 32px)')
        } else {
          ref?.resizable?.style.setProperty('flex-shrink', '0')
        }
      }}
      minWidth={300}
      maxWidth={column ? undefined : 1000}
      enable={
        column
          ? false
          : {
              left: true
            }
      }
      style={{
        display: 'flex',
        borderRadius: column ? 6 : 0,
        flexDirection: 'column',
        opacity: sidebarState.rightBarVisible ? 1 : 0,
        visibility: sidebarState.rightBarVisible ? 'visible' : 'hidden',
        position: sidebarState.rightBarVisible ? 'relative' : 'absolute',
        background: Colors.Background.Secondary,
        marginBottom: column ? 24 : 0,
        padding: '12px',
        overflow: 'hidden'
      }}
    >
      <Tabs activeKey={sidebarState.rightBarActive}>
        <TabPane tab={t('general.labels')} key="label">
          <MediaLabelController labelType={labelType} labelIds={labelIds} />
        </TabPane>
        <TabPane tab={t('general.chapters')} key="chapter">
          <MediaChapterController />
        </TabPane>
        <TabPane tab={t('general.subtitles')} key="subtitle">
          <MediaSubtitleSidebar />
        </TabPane>
      </Tabs>
    </Resizable>
  )
})

export default MediaSidebar
