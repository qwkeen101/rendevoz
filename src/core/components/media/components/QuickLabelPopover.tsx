import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { assignProperties } from '@/utils'
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMemoizedFn, useSelectAtomValue } from '@/hooks'
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
import useRenderLabelEditor from '@/core/object/renderer/useRenderLabelEditor'
import { getSetting } from '@/core'
import FileSystem from '@/api/fileSystem'
import Id from '@/utils/id'
export default memo(() => {
  const isPlayRef = useRef(false)
  const labelType = useSelectAtomValue(MediaStateAtom, s => s.labelType)
  const instance = useMediaInstance()
  const store = useStore()
  const playerContainer = instance.getPlayerElement?.()
  const setMediaState = useSetAtom(MediaStateAtom)
  const fullScreen = useSelectAtomValue(MediaStateAtom, s => s.fullScreen)
  const { open, renderPopover, labelDetails, attachTags } = useRenderLabelEditor<IMediaLabel>({
    onInsert: (name, tags) => {
      handleInsertNote(labelDetails, name, tags)
    },
    showTags: !fullScreen,
    showMoveTo: !fullScreen,
    onCancel: () => {
      if (labelDetails?.imageUrl) {
        FileSystem.fs.deleteFile(labelDetails.imageUrl)
      }
    },
    onClose: () => {
      instance.focus?.()
      if (isPlayRef.current && !useRenderLabelEditor.labelNeedMoveTo) {
        instance.actionOps?.play()
      }
      setMediaState(s => ({ ...s, labelPopoverVisible: false }))
    },
    parentElement: fullScreen ? playerContainer : undefined
  })
  const handleInsertNote = useMemoizedFn(async (details = labelDetails, name?: string, tags?: number[]) => {
    const id = details?.id || Id.getId()
    if (details) {
      if (details.id) {
        if (!(await ObjectStore(labelType).getOneById(details.id))) {
          instance.on?.({
            type: 'addLabel',
            currentLabel: { ...details, id, name }
          })
          if (tags?.length) {
            attachTags(id, tags)
          }
        } else {
          const labelMeta = MetaStore.getMetaObjectByObjectId(details.id, true)
          if (labelMeta) {
            MetaStore.updateMetaObject({ id: labelMeta.id, name })
          }
        }
      } else {
        instance.on?.({
          type: 'addLabel',
          currentLabel: { ...details, id, name }
        })
        if (tags?.length) {
          attachTags(id, tags)
        }
      }
    }
  })
  assignProperties(instance, {
    openLabelEditor: (l, position) => {
      const setting = getSetting()
      if (setting.media.openPopoverWhenHighlight === false && !l.id) {
        setTimeout(() => handleInsertNote(l))
        return
      }
      const mediaContainer = instance.getMediaContainer?.()
      if (!mediaContainer) return
      const bounding = mediaContainer.getBoundingClientRect()
      open(l, {
        width: 0,
        height: 0,
        left: position?.x ?? bounding.left + bounding.width / 2,
        top: position?.y ?? bounding.bottom
      })
      setMediaState(s => ({ ...s, labelPopoverVisible: true }))
      isPlayRef.current = !store.get(MediaStateAtom).paused
      instance.actionOps?.pause()
    }
  })
  return renderPopover({
    extra: labelDetails?.selectedText ? (
      <div
        className={'font-size-12 transparent-font'}
        style={{
          borderLeft: '2px solid var(--emphasis)',
          padding: '3px 6px',
          marginBottom: 4
        }}
      >
        {labelDetails.selectedText}
      </div>
    ) : null
  })
})
