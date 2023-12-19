import { MetaStore } from '@/api/stores'
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
import { useTranslation } from 'react-i18next'

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
  const [currentDisplay, setCurrentDisplay] = useState<{
    visible: 'main' | 'tags' | 'links' | 'attachments' | 'preview'
  }>({
    visible: 'main'
  })
  const { t } = useTranslation()
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
        overflowY: 'auto',
        maxHeight: '80vh'
      }}
    >
      <Content
        className={'d-h-g'}
        style={{
          display: 'flex',
          position: 'sticky',
          top: 0,
          background: Colors.Background.Popover,
          justifyContent: 'space-between',
          padding: '6px 8px 4px 16px',
          cursor: 'grab',
          width: '100%',
          zIndex: 9999
        }}
      >
        <div style={{ fontWeight: 600 }}>{t('general.Object info')}</div>
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
          padding: '8px 16px 16px'
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
      },
      closeDetails: () => {
        setGState(s => ({ ...s, visible: false }))
      }
    }
  })
  useLayoutEffect(() => {
    if (gState.visible) {
      const node = rndRef.current?.getSelfElement()
      if (node) {
        node.style.opacity = '0'
        rndRef.current?.updateSize({
          width: Math.max(node.clientWidth, 560),
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
      enableResizing={{
        left: true,
        right: true
      }}
      style={{
        opacity: gState.visible ? 1 : 0,
        pointerEvents: gState.visible ? 'auto' : 'none',
        zIndex: gState.visible ? 1000 : -1,
        background: Colors.Background.Popover,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: Colors.Background.PopoverBoxShadow
      }}
      default={{
        width: 600,
        height: 'auto'
      }}
      dragHandleClassName={'d-h-g'}
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
