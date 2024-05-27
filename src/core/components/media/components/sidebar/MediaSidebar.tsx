import { TabPane, Tabs } from '@/components'
import MediaChapterController from './MediaChapterController'
import MediaLabelController from './MediaLabelController'
import { memo, useEffect, useLayoutEffect, useRef } from 'react'
import useMediaSidebarState from '../../hooks/useMediaSidebarState'
import { Resizable } from 're-resizable'
import Subtitle from '@/core/components/media/components/sidebar/Subtitle'
import { useAtomValue } from 'jotai'
import { MediaLayoutAtom } from '@/core/components/media/hooks/useVideoLayout'
import { useSelectAtomValue, useUpdateEffect } from '@/hooks'
import { MediaStateAtom } from '@/core/components/media/hooks/useMediaState'
import { useTranslation } from 'react-i18next'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import CommonAttachmentsSidebar from '@/core/components/common/CommonAttachmentsSidebar'
import { GlobalSetting } from '@/core'

const MediaSidebar = memo(() => {
  const [sidebarState, setSidebarState] = useMediaSidebarState()
  const column = useAtomValue(MediaLayoutAtom)
  const labelType = useSelectAtomValue(MediaStateAtom, s => s.labelType)
  const labelIds = useSelectAtomValue(MediaStateAtom, s => s.labels)
  const subtitleInSidebar = GlobalSetting.useSelectSettingAtom('subtitleInSidebar')
  const visible =
    (sidebarState.rightBarActive !== 'hide' && (subtitleInSidebar === false ? sidebarState.rightBarActive !== 'subtitle' : true)) ||
    (subtitleInSidebar === false && sidebarState.subtitleOpen && !column)
  const metaId = useSelectAtomValue(MediaStateAtom, s => s.metaId)
  const instance = useMediaInstance()
  useUpdateEffect(() => {
    instance.on?.({
      type: 'externalStateChange',
      state: {
        defaultActiveSidebar: sidebarState.rightBarActive
      }
    })
  }, [sidebarState.rightBarActive])

  return (
    <>
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
        minHeight={column ? 240 : undefined}
        style={{
          display: 'flex',
          borderRadius: column ? 12 : 0,
          flexDirection: 'column',
          borderWidth: column ? '1px' : '0px 0px 0px 1px',
          borderColor: 'var(--border-background)',
          borderStyle: 'solid',
          flexGrow: 1,
          opacity: visible ? 1 : 0,
          visibility: visible ? 'visible' : 'hidden',
          position: visible ? 'relative' : 'absolute',
          marginBottom: column ? 16 : 0,
          overflow: 'hidden'
        }}
      >
        <Tabs activeKey={sidebarState.rightBarActive} disableTabNav={true}>
          <TabPane key="label">
            <MediaLabelController labelType={labelType} labelIds={labelIds} />
          </TabPane>
          <TabPane key="chapter">
            <MediaChapterController />
          </TabPane>
          <TabPane key="attachments">{metaId && <CommonAttachmentsSidebar metaId={metaId} />}</TabPane>
          {subtitleInSidebar ? (
            <TabPane key="subtitle">
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <Subtitle />
              </div>
            </TabPane>
          ) : null}
        </Tabs>
        {subtitleInSidebar === false &&
        sidebarState.subtitleOpen &&
        !column &&
        (sidebarState.rightBarActive === 'hide' || sidebarState.rightBarActive === 'subtitle') ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
            <Subtitle />
          </div>
        ) : null}
      </Resizable>
    </>
  )
})

export default MediaSidebar
