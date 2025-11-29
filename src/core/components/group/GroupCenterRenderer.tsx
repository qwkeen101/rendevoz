// supports keyboard navigate
import { useEffect, useState } from 'react'
import { useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { assignProperties } from '@/utils'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { MetaStore } from '@/api/stores'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { Resizable } from 're-resizable'
import { Icon, Modal } from '@/components'
import { DockTabPaneContext } from '@/components/base/dock/DockTabPane'
import { ClassName } from 'rendevoz'
import SidebarObjectViewer from '@/core/components/SidebarObjectViewer'

export default () => {
  const [centerState, setCenterState] = useState<{
    visible: boolean
    objectId?: number
    type?: string
    rowId?: number
    prevName?: string
    nextName?: string
    metaId?: number
  }>({ visible: false })
  const [size, setSize] = useState({
    width: '800px',
    height: '600px'
  })
  const instance = useGroupInstance()
  const metaMap = MetaStore.getMetaObjectsMap()
  assignProperties(instance, {
    centerOps: {
      open: (metaId, rowId) => {
        const meta = MetaStore.getMetaObjectsMap().get(metaId)
        if (meta && meta.objectId) {
          if (Global.metaOps?.canPreview(meta)) {
            const prev = instance.valueOps?.getPrevMeta(rowId)
            const next = instance.valueOps?.getNextMeta(rowId)
            const nextMeta = next ? metaMap.get(next.metaId) : undefined
            const prevMeta = prev ? metaMap.get(prev.metaId) : undefined
            setCenterState(s => ({
              ...s,
              visible: true,
              type: meta.type,
              objectId: meta.objectId,
              rowId,
              metaId,
              prevName: prevMeta?.name || prevMeta?.placeholderName,
              nextName: nextMeta?.name || nextMeta?.placeholderName
            }))
          }
        }
      }
    }
  })

  const groupOpenInCenter = useSelectAtomValue(GroupStateAtom, s => s.data?.openIn) === 'center'
  const handleNavigateLeft = () => {
    if (centerState.rowId) {
      const prev = instance.valueOps?.getPrevMeta(centerState.rowId)
      prev && instance.centerOps?.open(prev.metaId, prev.rowId)
    }
  }
  const handleNavigateRight = () => {
    if (centerState.rowId) {
      const next = instance.valueOps?.getNextMeta(centerState.rowId)
      next && instance.centerOps?.open(next.metaId, next.rowId)
    }
  }
  const keydownHandler = useMemoizedFn((e: KeyboardEvent) => {
    if (e.defaultPrevented) return
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
    if (groupOpenInCenter && centerState.visible) {
      document.addEventListener('keydown', keydownHandler)
      return () => {
        document.removeEventListener('keydown', keydownHandler)
      }
    }
  }, [groupOpenInCenter, centerState.visible])
  const renderer = () => {
    if (centerState.visible && centerState.metaId && centerState.type) {
      return <SidebarObjectViewer id={centerState.metaId} />
    }
  }
  return (
    <Modal zIndex={500} visible={centerState.visible} onClose={() => setCenterState(f => ({ ...f, visible: false }))}>
      <Resizable
        defaultSize={size}
        onResizeStop={(event, direction, elementRef, delta) => {
          setSize({
            width: elementRef.clientWidth,
            height: elementRef.clientHeight
          })
        }}
      >
        <Icon
          name={'park-left'}
          size={24}
          containerStyle={{
            position: 'absolute',
            top: '50%',
            left: -40,
            transform: 'translate(0px, -50%)',
            zIndex: 10,
            color: 'white'
          }}
          onClick={handleNavigateLeft}
          className={ClassName.circleButton()}
        />
        <Icon
          onClick={handleNavigateRight}
          name={'park-right'}
          size={24}
          containerStyle={{
            position: 'absolute',
            top: '50%',
            right: -40,
            transform: 'translate(0px, -50%)',
            zIndex: 10,
            color: 'white'
          }}
          className={ClassName.circleButton()}
        />
        <DockTabPaneContext.Provider value={{ currentTabId: '' }}>
          <div
            key={centerState.objectId}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              borderRadius: 8,
              overflow: 'hidden'
            }}
          >
            {renderer()}
          </div>
        </DockTabPaneContext.Provider>
      </Resizable>
    </Modal>
  )
}
