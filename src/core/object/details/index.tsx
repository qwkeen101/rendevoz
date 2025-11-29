import { assignProperties } from '@/utils'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Content, Icon, IconWithPopover, ResizeAndDrag, WithBorder } from '@/components'
import Main from '@/core/object/details/Main'
import { Colors, Icons, KEY, Zindexes } from '@/consts'
import { ClassName } from 'rendevoz'
import { Rnd } from 'react-rnd'
import { useTranslation } from 'react-i18next'
import Id from '@/utils/id'
import isHotkey from 'is-hotkey'
import classnames from 'classnames'
import DetailsMenu from '@/core/object/details/DetailsMenu'
import { createPortal } from 'react-dom'
import { MetaStore } from '@/api/stores'
import trans from '@/consts/trans'

const ObjectDetails = ({ metaId, onClose, visible }: { visible?: boolean; metaId: number; onClose?: VoidFunction }) => {
  const m = MetaStore.useValue(metaId)
  const { t } = useTranslation()
  return (
    <Content
      flex
      column
      fullHeight
      fullWidth
      style={{
        maxHeight: '80vh'
      }}
    >
      <div className={classnames('d-h-g shrink-0 flex px-6 py-3 justify-between cursor-grab w-full transition-all')}>
        <div className={'text-xl font-bold'}>{t('general.Details')}</div>
        <div className={'flex gap-5 items-center'}>
          {m && (
            <>
              <IconWithPopover
                placement={['bottom', 'top']}
                name={Icons.More}
                className={'opacity-40 -mr-1 hover:opacity-100 transition-opacity cursor-pointer'}
                size={18}
                content={setV => <DetailsMenu onClose={() => setV(false)} id={metaId} />}
              />
              <Icon
                name={Icons.Link}
                onClick={() => {
                  Global.metaOps?.copyLink(metaId)
                }}
                tooltip={t(trans.CopyLink)}
                size={18}
                strokeWidth={4}
                className={'opacity-40 hover:opacity-100 transition-opacity cursor-pointer'}
              />
              <Icon
                name={Icons.Efferent}
                onClick={() => {
                  Global.layoutOps?.openObject(metaId)
                  onClose?.()
                }}
                size={18}
                strokeWidth={4}
                className={'opacity-40 hover:opacity-100 transition-opacity cursor-pointer'}
              />
            </>
          )}
          <Icon
            name={'park-close'}
            onClick={() => {
              onClose?.()
            }}
            size={18}
            strokeWidth={4}
            className={'opacity-40 hover:opacity-100 transition-opacity cursor-pointer'}
          />
        </div>
      </div>
      <div className={'w-full grow overflow-y-auto'}>
        <Main visible={visible} metaId={metaId} />
      </div>
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
  assignProperties(Global, {
    metaOps: {
      ...Global.metaOps,
      toggleDetails: (id, visible) => {
        if (id) {
          const openId = Id.getId()
          metaHistory.current.push({
            metaId: id,
            id: openId
          })
          setGState({ visible: visible ?? true, metaId: id, id: openId })
        } else {
          setGState(s => ({ ...s, visible: visible ?? !s.visible }))
        }
      },
      openDetails: id => {
        if (id) {
          const openId = Id.getId()
          metaHistory.current.push({
            metaId: id,
            id: openId
          })
          setGState({ visible: true, metaId: id, id: openId })
        } else {
          setGState(s => ({ ...s, visible: true }))
        }
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
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Escape, e)) {
        setGState(s => ({ ...s, visible: false }))
      }
    }
    document.addEventListener('keydown', h)
    return () => {
      document.removeEventListener('keydown', h)
    }
  }, [gState.visible])
  const rndRef = useRef<Rnd>()
  const { t } = useTranslation()
  if (!gState.visible) return null
  return createPortal(
    <ResizeAndDrag
      minWidth={240}
      ref={rndRef}
      style={{
        opacity: gState.visible ? 1 : 0,
        pointerEvents: gState.visible ? 'auto' : 'none',
        zIndex: gState.visible ? Zindexes.ObjectDetails : -1
      }}
      default={{
        width: 600,
        height: 'auto'
      }}
      dragHandleClassName={'d-h-g'}
    >
      <WithBorder borderRadius={16} className={'w-full h-full rounded-3xl overflow-y-auto'}>
        {gState.metaId ? (
          <ObjectDetails
            key={gState.metaId}
            onClose={() => {
              setGState(s => ({ ...s, visible: false }))
            }}
            visible={gState.visible}
            metaId={gState.metaId}
          />
        ) : (
          <Content
            className={'bold-font transparent-font d-h-g'}
            style={{
              padding: '60px 0px',
              fontSize: 18
            }}
            flex
            centered
            fullWidth
            fullHeight
          >
            <Icon
              onClick={() => setGState(s => ({ ...s, visible: false }))}
              name={'park-close'}
              className={ClassName.flatButton(4, '4px')}
              style={{
                position: 'absolute',
                top: 8,
                right: 8
              }}
            />
            {t('general.No selected object')}
          </Content>
        )}
      </WithBorder>
    </ResizeAndDrag>,
    document.body
  )
}

export default ObjectDetails
