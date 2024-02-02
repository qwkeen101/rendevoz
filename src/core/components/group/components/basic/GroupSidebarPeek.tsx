import useGroupState from '@/core/components/group/hooks/useGroupState'
import { Resizable } from 're-resizable'
import MediaLabelController from '@/core/components/media/components/sidebar/MediaLabelController'
import { memo, useEffect, useState } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import EditorLabelController from '@/core/components/editor/components/EditorLabelController'
import PdfLabelController from '@/core/components/pdf/components/sidebar/PdfLabelController'
import { RENDEVOZ_DEFAULT_TABS } from '@/api/lifycycle/startup/registerTabs'
import { Colors, KEY } from '@/consts'
import { Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { DockTabPaneContext } from '@/components/base/dock/DockTabPane'
import { Rendevoz } from '@/core/rendevoz'
import { useMemoizedFn } from '@/hooks'
import isHotkey from 'is-hotkey'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

export default memo(() => {
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
  const sidebarState = groupState.sidebarState
  const instance = useGroupInstance()
  const handleNavigateLeft = () => {
    if (sidebarState?.type === 'preview' && sidebarState.rowId) {
      const prev = instance.valueOps?.getPrevMeta(sidebarState.rowId)
      prev &&
        instance.sidebarOps?.open({
          metaId: prev.metaId,
          rowId: prev.rowId,
          type: 'preview'
        })
    }
  }
  const handleNavigateRight = () => {
    if (sidebarState?.type === 'preview' && sidebarState.rowId) {
      const next = instance.valueOps?.getNextMeta(sidebarState.rowId)
      next &&
        instance.sidebarOps?.open({
          metaId: next.metaId,
          rowId: next.rowId,
          type: 'preview'
        })
    }
  }
  const keydownHandler = useMemoizedFn((e: KeyboardEvent) => {
    if (e.defaultPrevented) return
    if (!instance.values.isFocused) return
    if (e.target instanceof Element && e.target.closest('input, textarea, [contenteditable="true"]')) return
    if (isHotkey(KEY.ArrowLeft, e)) {
      handleNavigateLeft()
      e.preventDefault()
    }
    if (isHotkey(KEY.ArrowRight, e)) {
      handleNavigateRight()
      e.preventDefault()
    }
  })
  useEffect(() => {
    if (groupState.sidebarVisible && sidebarState?.type === 'preview') {
      document.addEventListener('keydown', keydownHandler)
      return () => {
        document.removeEventListener('keydown', keydownHandler)
      }
    }
  }, [groupState.sidebarVisible, sidebarState?.type])
  const renderer = () => {
    if (groupState.sidebarVisible) {
      if (groupState.sidebarState?.type === 'preview') {
        if (groupState.sidebarState.metaId && peekMeta) {
          const page = Rendevoz.Actions.Layout.getRegisteredTabContent(peekMeta.type)
          if (page) {
            return (
              <DockTabPaneContext.Provider key={peekMeta.id} value={{ currentTabId: '' }}>
                {page({ objectId: peekMeta.objectId, metaId: peekMeta.id })}
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
        right: 0,
        boxShadow: Colors.Background.BoxShadow,
        opacity: groupState.sidebarVisible ? 1 : 0,
        top: 0,
        pointerEvents: groupState.sidebarVisible ? 'auto' : 'none',
        transform: groupState.sidebarVisible ? undefined : 'translateX(100%)'
      }}
      enable={{ left: true }}
    >
      <Icon
        name={'park-double-right'}
        className={ClassName.flatButton(4, '5px')}
        size={18}
        onClick={() => {
          setGroupState(s => ({ ...s, sidebarVisible: false }))
        }}
        style={{
          background: Colors.Background.Popover,
          position: 'absolute',
          left: -36,
          color: Colors.Font.Transparent,
          top: '20px',
          boxShadow: Colors.Background.BorderBoxShadow,
          transform: 'translateY(-50%)'
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          padding: groupState.sidebarState?.type === 'labels' ? 12 : 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {renderer()}
      </div>
    </Resizable>
  )
})
