import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { assignProperties } from '@/utils'
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSelectAtomValue } from '@/hooks'
import { MediaStateAtom } from '@/core/components/media/hooks/useMediaState'
import { MetaStore, ObjectStore } from '@/api/stores'
import { IMediaLabel, XYPosition } from '~/typings'
import { createPortal } from 'react-dom'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import { AnimatePopover, Content, ContentEditor, Icon } from '@/components'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { ClassName } from 'rendevoz'
import { useSetAtom, useStore } from 'jotai'
export default memo(() => {
  const [popoverState, setPopoverState] = useState<{
    visible: boolean
    labelId?: number
    position?: XYPosition
  }>({
    visible: false
  })
  const isPlayRef = useRef(false)
  const { t } = useTranslation()
  const labelType = useSelectAtomValue(MediaStateAtom, s => s.labelType)
  const currLabel = ObjectStore(labelType).useValue(popoverState.labelId) as IMediaLabel | undefined
  const instance = useMediaInstance()
  const store = useStore()
  const playerContainer = instance.getPlayerElement?.()
  const setMediaState = useSetAtom(MediaStateAtom)
  const fullScreen = useSelectAtomValue(MediaStateAtom, s => s.fullScreen)
  assignProperties(instance, {
    openLabelPopover: labelId => {
      const mediaContainer = instance.getMediaContainer?.()
      console.log(labelId, mediaContainer)
      if (!mediaContainer) return
      const bounding = mediaContainer.getBoundingClientRect()
      setPopoverState({
        visible: true,
        labelId,
        position: {
          x: bounding.right,
          y: bounding.bottom
        }
      })
    }
  })
  useLayoutEffect(() => {
    if (popoverState.visible) {
      setMediaState(s => ({ ...s, labelPopoverVisible: true }))
      isPlayRef.current = !store.get(MediaStateAtom).paused
      instance.actionOps?.pause()
      return () => {
        instance.focus?.()
        if (isPlayRef.current) {
          instance.actionOps?.play()
        }
      }
    } else {
      setMediaState(s => ({ ...s, labelPopoverVisible: false }))
    }
  }, [popoverState.visible])
  return (
    <AnimatePopover
      position={{
        left: popoverState.position?.x,
        top: popoverState.position?.y
      }}
      onVisiblityChange={v => setPopoverState(s => ({ ...s, visible: v }))}
      visible={currLabel && popoverState.visible}
      parentElement={fullScreen ? playerContainer : undefined}
      positions={['bottom', 'top']}
      align={'end'}
      content={
        <div
          style={{
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            width: 320,
            background: Colors.Background.Popover,
            boxShadow: Colors.Background.PopoverBoxShadow,
            borderRadius: 8
          }}
        >
          <Content flex alignItems={'center'} gap={8}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{t('general.Edit highlight')}</div>
            {currLabel && <div className={'transparent-font font-size-12'}> • {normalizeSecondsToTime(currLabel?.time)}</div>}
            <Icon
              size={14}
              name={'park-close'}
              onClick={() => setPopoverState(s => ({ ...s, visible: false }))}
              className={ClassName.circleButton()}
              style={{ marginLeft: 'auto' }}
            />
          </Content>
          <ContentEditor
            onCancel={() => {
              setTimeout(() => {
                console.log(currLabel)
                currLabel && instance.deleteLabel?.(currLabel?.id)
              }, 300)
              setPopoverState(s => ({ ...s, visible: false }))
            }}
            placeholder={'Press ↵ to save, Esc to cancel.'}
            onChange={v => {
              if (currLabel) {
                const labelMeta = MetaStore.getMetaObjectByObjectId(currLabel.id)
                if (labelMeta) {
                  MetaStore.updateMetaObject({ id: labelMeta.id, name: v })
                } else {
                  ObjectStore(labelType).updateOne({ id: currLabel.id, name: v })
                }
              }
              setPopoverState(s => ({ ...s, visible: false }))
            }}
            value={currLabel?.name}
          />
        </div>
      }
    ></AnimatePopover>
  )
})
