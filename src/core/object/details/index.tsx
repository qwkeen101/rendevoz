import { MetaStore } from '@/api/stores'
import { assignProperties } from '@/utils'
import { GlobalInstance } from '@/hooks'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Content, Icon, ResizeAndDrag } from '@/components'
import Main from '@/core/object/details/Main'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import { RelatedPanel } from './Related'
import { Rnd } from 'react-rnd'
import { useTranslation } from 'react-i18next'
import Id from '@/utils/id'

const ObjectDetails = ({
  metaId,
  onClose,
  canBackward,
  canForward,
  onAuto,
  onBackward,
  onForward,
  onPeek
}: {
  metaId: number
  onClose?: VoidFunction
  onPeek: VoidFunction
  onAuto: VoidFunction
  canForward: boolean
  canBackward: boolean
  onForward: VoidFunction
  onBackward: VoidFunction
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
        <Content flex gap={4}>
          <Icon
            name={'park-arrow-left'}
            onClick={() => {
              if (canBackward) {
                onBackward()
              }
            }}
            style={{
              color: canBackward ? Colors.Font.Primary : Colors.Font.SuperTransparent
            }}
            className={ClassName.flatButton(4, '4px')}
          />
          <Icon
            name={'park-arrow-right'}
            onClick={() => {
              if (canForward) {
                onForward()
              }
            }}
            style={{
              color: canForward ? Colors.Font.Primary : Colors.Font.SuperTransparent
            }}
            className={ClassName.flatButton(4, '4px')}
          />
          <Icon
            name={'park-close'}
            onClick={() => {
              onClose?.()
            }}
            className={ClassName.flatButton(4, '4px')}
          />
        </Content>
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
    id?: number
  }>({
    visible: false
  })
  const metaHistory = useRef<
    {
      metaId: number
      id: number
    }[]
  >([])
  assignProperties(GlobalInstance, {
    metaOps: {
      ...GlobalInstance.metaOps,
      openDetails: id => {
        const openId = Id.getId()
        metaHistory.current.push({
          metaId: id,
          id: openId
        })
        setGState({ visible: true, metaId: id, id: openId })
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
  }, [gState.visible])
  const rndRef = useRef<Rnd>()
  const prev = useRef()
  const currentMetaHistoryIndex = gState.metaId ? metaHistory.current.findIndex(i => i.id === gState.id) : -1
  return (
    <ResizeAndDrag
      minWidth={240}
      ref={rndRef}
      style={{
        opacity: gState.visible ? 1 : 0,
        pointerEvents: gState.visible ? 'auto' : 'none',
        zIndex: gState.visible ? 1001 : -1
      }}
      default={{
        width: 600,
        height: 'auto'
      }}
      dragHandleClassName={'d-h-g'}
    >
      <Content
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          background: Colors.Background.Popover,
          boxShadow: Colors.Background.PopoverBoxShadow
        }}
      >
        {gState.metaId && (
          <ObjectDetails
            canForward={currentMetaHistoryIndex >= 0 && metaHistory.current.length - 1 > currentMetaHistoryIndex}
            canBackward={currentMetaHistoryIndex > 0}
            onBackward={() => {
              setGState(s => ({ ...s, ...metaHistory.current[currentMetaHistoryIndex - 1] }))
            }}
            onForward={() => {
              setGState(s => ({ ...s, ...metaHistory.current[currentMetaHistoryIndex + 1] }))
            }}
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
