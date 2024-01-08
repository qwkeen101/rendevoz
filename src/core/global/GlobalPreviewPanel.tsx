import { assignProperties } from '@/utils'
import { GlobalInstance } from '@/hooks'
import { useLayoutEffect, useRef, useState } from 'react'
import { MetaStore } from '@/api/stores'
import { RENDEVOZ_DEFAULT_TABS } from '@/api/lifycycle/startup/registerTabs'
import { createPortal } from 'react-dom'
import { ResizeAndDrag } from '@/components'
import { Colors } from '@/consts'
import { Rnd } from 'react-rnd'

export default () => {
  const [pState, setPState] = useState<{
    visible: boolean
    metaId?: number
    showCover?: boolean
  }>({
    visible: false
  })
  const meta = MetaStore.useValue(pState.metaId)
  const rndRef = useRef<Rnd>()
  useLayoutEffect(() => {
    if (pState.visible) {
      setPState(s => ({ ...s, showCover: true }))
      const rnd = rndRef.current
      if (rnd) {
        const node = rnd.getSelfElement()
        if (!node) return
        rnd.updatePosition({
          y: 72,
          x: (window.innerWidth - Math.min(window.innerWidth - 144, 970)) / 2
        })
        rnd.updateSize({
          width: Math.min(window.innerWidth - 144, 970),
          height: window.innerHeight - 144
        })
      }
    }
  }, [pState.metaId, pState.visible])
  assignProperties(GlobalInstance, {
    metaOps: {
      ...GlobalInstance.metaOps,
      canPreview: meta => {
        const previewElement = RENDEVOZ_DEFAULT_TABS.find(i => i.type === meta.type)
        const canPreview = !!(previewElement && meta.objectId)
        return canPreview
      },
      preview: id => {
        setPState({
          visible: true,
          metaId: id
        })
      }
    }
  })
  const canPreview = meta && GlobalInstance.metaOps?.canPreview(meta)

  if (canPreview) {
    const page = RENDEVOZ_DEFAULT_TABS.find(i => i.type === meta.type)
    if (!page || !meta.objectId) return null
    return createPortal(
      <>
        {pState.showCover && (
          <div
            onClick={() => {
              setPState({ visible: false })
            }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9998, backdropFilter: 'blur(4px)' }}
          ></div>
        )}
        <ResizeAndDrag
          ref={rndRef}
          default={{
            x: 400,
            y: 400,
            width: 400,
            height: 400
          }}
          onDragStart={() => {
            setPState(s => ({ ...s, showCover: false }))
          }}
          disableDragging={true}
          style={{
            background: Colors.Background.Global,
            boxShadow: Colors.Background.BoxShadow,
            borderRadius: 12,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column'
          }}
          dragHandleClassName={'dh'}
        >
          <div style={{ width: '100%', overflow: 'hidden', height: 0, flex: 1 }}>
            {page.content({ objectId: meta.objectId, metaId: meta.id })}
          </div>
        </ResizeAndDrag>
      </>,
      document.body
    )
  }
  return null
}
