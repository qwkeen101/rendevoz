import { MetaStore } from '@/stores'
import { assignProperties } from '@/utils'
import { GlobalInstance } from '@/hooks'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Content, Icon, ResizeAndDrag } from '@/components'
import Main from '@/core/object/details/Main'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import { RelatedPanel } from './Related'
import { AttachmentWrapper } from '@/core'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import { Rnd } from 'react-rnd'

const ObjectDetails = ({
  metaId,
  onClose,
  onPeek,
  onAuto
}: {
  metaId: number
  onClose?: VoidFunction
  onPeek: VoidFunction
  onAuto: VoidFunction
}) => {
  const meta = MetaStore.useValue(metaId)
  const [currentDisplay, setCurrentDisplay] = useState<{
    visible: 'main' | 'tags' | 'links' | 'attachments' | 'preview'
  }>({
    visible: 'main'
  })
  useEffect(() => {
    setCurrentDisplay({ visible: 'main' })
  }, [metaId])
  return (
    <Content
      flex
      column
      fullHeight
      fullWidth
      style={{
        maxHeight: '90vh',
        boxShadow: Colors.Background.BoxShadow,
        borderRadius: 12,
        background: currentDisplay.visible === 'preview' ? Colors.Background.Global : undefined
      }}
    >
      <Content
        flex
        alignItems={'center'}
        justifyContent={'space-between'}
        style={{
          padding: '4px 12px',
          fontWeight: 600,
          width: '100%',
          cursor: 'grab',
          borderBottom: `1px solid ${Colors.Background.Border}`
        }}
        className={'o-d-h'}
      >
        {currentDisplay.visible === 'main' ? (
          <div className={ClassName.ellipsisFont(1)} style={{ maxWidth: '90%', fontSize: 13 }}>
            {meta?.name}
          </div>
        ) : (
          <Content flex gap={12}>
            <Icon
              className={ClassName.circleButton()}
              name={'park-back'}
              onClick={() => {
                onAuto()
                setCurrentDisplay({ visible: 'main' })
              }}
            />
            Back
          </Content>
        )}
        <Icon
          name={'park-close'}
          onClick={() => {
            onClose?.()
          }}
          className={ClassName.circleButton()}
        />
      </Content>
      <Content
        fullWidth
        style={{
          height: 0,
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: currentDisplay.visible !== 'tags' && currentDisplay.visible !== 'preview' ? 12 : 0
        }}
      >
        {currentDisplay.visible === 'main' && (
          <Main
            onPreview={() => {
              setCurrentDisplay({ visible: 'preview' })
              onPeek()
            }}
            onViewAtt={() => {
              setCurrentDisplay({ visible: 'attachments' })
            }}
            onOpenTag={() => {
              setCurrentDisplay({ visible: 'tags' })
            }}
            onViewLinks={() => {
              setCurrentDisplay({ visible: 'links' })
            }}
            metaId={metaId}
          />
        )}
        {currentDisplay.visible === 'attachments' && (
          <AttachmentWrapper
            style={{ height: '100%' }}
            innerContainerStyle={{
              justifyContent: 'space-between',
              height: '100%',
              overflowY: 'auto'
            }}
            visible={true}
            maxVisibleAttachments={10}
            metaId={metaId}
          />
        )}
        {currentDisplay.visible === 'tags' && (
          <MetaTagPicker
            style={{
              minHeight: 240
            }}
            alreadyTags={meta?.tags || []}
            onChange={tags => {
              MetaStore.updateMetaObject({ id: metaId, tags }, true)
            }}
          />
        )}
        {currentDisplay.visible === 'links' && <RelatedPanel metaId={metaId} />}
      </Content>
    </Content>
  )
}

export const GlobalObjectDetails = () => {
  const [gState, setGState] = useState<{
    visible: boolean
    metaId?: number
  }>({
    visible: false
  })
  assignProperties(GlobalInstance, {
    metaOps: {
      ...GlobalInstance.metaOps,
      openDetails: id => {
        setGState({ visible: true, metaId: id })
      }
    }
  })
  useLayoutEffect(() => {
    if (gState.visible) {
      const node = rndRef.current?.getSelfElement()
      if (node) {
        node.style.opacity = '0'
        rndRef.current?.updateSize({
          width: Math.max(node.clientWidth, 660),
          height: 'auto'
        })
        setTimeout(() => {
          rndRef.current?.updatePosition({
            x: window.innerWidth / 2 - node.clientWidth / 2,
            y: window.innerHeight / 2 - node.clientHeight / 2
          })
          setTimeout(() => {
            node.style.opacity = '1'
          })
        })
      }
    }
  }, [gState.visible, gState.metaId])
  const rndRef = useRef<Rnd>()
  const prev = useRef()
  return (
    <ResizeAndDrag
      minWidth={240}
      ref={rndRef}
      style={{
        opacity: gState.visible ? 1 : 0,
        pointerEvents: gState.visible ? 'auto' : 'none',
        zIndex: 1000,
        background: Colors.Background.Secondary,
        borderRadius: 12
      }}
      default={{
        width: 600,
        height: 'auto'
      }}
      dragHandleClassName={'o-d-h'}
    >
      <Content style={{ width: '100%', height: '100%' }}>
        {gState.metaId && (
          <ObjectDetails
            onAuto={() => {
              if (prev.current) {
                rndRef.current?.updatePosition({
                  x: prev.current.x,
                  y: prev.current.y
                })
                rndRef.current?.updateSize({
                  width: prev.current.width,
                  height: 'auto'
                })
              }
              prev.current = undefined
            }}
            onPeek={() => {
              const rnd = rndRef.current
              if (rnd) {
                const self = rnd.getSelfElement() as HTMLElement
                const bounding = self.getBoundingClientRect()
                prev.current = {
                  width: bounding.width,
                  y: bounding.y,
                  x: bounding.x
                }
                rnd.updatePosition({
                  y: 72,
                  x: (window.innerWidth - Math.min(window.innerWidth - 144, 970)) / 2
                })
                rnd.updateSize({
                  width: Math.min(window.innerWidth - 144, 970),
                  height: window.innerHeight - 144
                })
              }
            }}
            onClose={() => {
              setGState(s => ({ ...s, visible: false }))
            }}
            metaId={gState.metaId}
          />
        )}
      </Content>
    </ResizeAndDrag>
  )
}

export default ObjectDetails
