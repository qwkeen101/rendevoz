import useGroupState from '@/core/components/group/hooks/useGroupState'
import { Resizable } from 're-resizable'
import MediaLabelController from '@/core/components/media/components/sidebar/MediaLabelController'
import { useEffect, useState } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import EditorLabelController from '@/core/components/editor/components/EditorLabelController'
import PdfLabelController from '@/core/components/pdf/components/sidebar/PdfLabelController'
import { RENDEVOZ_DEFAULT_TABS } from '@/api/lifycycle/startup/registerTabs'
import { Colors } from '@/consts'
import { Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { DockTabPaneContext } from '@/components/base/dock/DockTabPane'

export default () => {
  const [groupState, setGroupState] = useGroupState()
  const [labelIds, setLabelIds] = useState([])
  const [labelType, setLabelType] = useState('')
  const peekMeta = MetaStore.useValue(groupState.sidebarState?.metaId)
  useEffect(() => {
    if (groupState.sidebarState?.type === 'labels') {
      const { objectType, objectId } = groupState.sidebarState
      ObjectStore(objectType)
        .getOneById(objectId)
        .then(res => {
          if (res && res.labels) {
            setLabelIds(res.labels)
            setLabelType(`${objectType}Label`)
          }
        })
    }
  }, [groupState.sidebarState?.type, groupState.sidebarState?.objectType, groupState.sidebarState?.objectId])
  const renderer = () => {
    if (groupState.sidebarVisible) {
      if (groupState.sidebarState?.type === 'preview') {
        if (groupState.sidebarState.metaId && peekMeta) {
          const page = RENDEVOZ_DEFAULT_TABS.find(i => i.type === peekMeta.type)
          if (page) {
            return (
              <DockTabPaneContext.Provider key={peekMeta.id} value={{ currentTabId: '' }}>
                {page.content({ objectId: peekMeta.objectId })}
              </DockTabPaneContext.Provider>
            )
          }
        }
      }
      if (groupState.sidebarState?.type === 'labels' && labelIds && labelType) {
        switch (groupState.sidebarState.objectType) {
          case 'video':
          case 'audio':
            return <MediaLabelController labelType={labelType} labelIds={labelIds} />
          case 'note':
          case 'webpage':
            return <EditorLabelController labelType={labelType} labelIds={labelIds} />
          case 'pdf':
            return <PdfLabelController labelIds={labelIds} />
        }
      }
    }
  }
  return (
    <Resizable
      defaultSize={{
        width: '40vw',
        height: '100%'
      }}
      style={{
        position: 'absolute',
        zIndex: 50,
        background: Colors.Background.Global,
        borderLeft: `1px solid ${Colors.Background.Border}`,
        right: 0,
        boxShadow: 'rgba(15, 15, 15, 0.016) 0px 0px 0px 1px, rgba(15, 15, 15, 0.03) 0px 3px 6px, rgba(15, 15, 15, 0.06) 0px 9px 24px',
        opacity: groupState.sidebarVisible ? 1 : 0,
        top: 0,
        pointerEvents: groupState.sidebarVisible ? 'auto' : 'none',
        transform: groupState.sidebarVisible ? undefined : 'translateX(100%)'
      }}
      enable={{ left: true }}
    >
      <Icon
        name={'park-right'}
        className={ClassName.circleButton()}
        size={24}
        onClick={() => {
          setGroupState(s => ({ ...s, sidebarVisible: false }))
        }}
        containerStyle={{
          position: 'absolute',
          left: -38,
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          padding: groupState.sidebarState?.type === 'labels' ? 12 : 0,
          overflow: 'hidden'
        }}
      >
        {renderer()}
      </div>
    </Resizable>
  )
}
