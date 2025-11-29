import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { assignProperties } from '@/utils'
import { memo, useRef } from 'react'
import { useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { MediaStateAtom } from '@/core/components/media/hooks/useMediaState'
import { MetaStore, ObjectStore } from '@/api/stores'
import { IMediaLabel } from '~/typings'
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
      const state = instance.getMediaState?.()
      const mediaContainer = state?.layout?.floatBarMode ? instance.getFloatBarElement?.() : instance.getMediaContainer?.()
      if (!mediaContainer && !position) return
      if (position) {
        open(
          l,
          {
            width: 0,
            height: 0,
            left: position?.x,
            top: position?.y
          },
          'top'
        )
      } else if (mediaContainer) {
        const bounding = mediaContainer.getBoundingClientRect()
        open(
          l,
          {
            width: 0,
            height: 0,
            left: bounding.left + bounding.width / 2,
            top: state?.layout?.floatBarMode ? bounding.top - 16 : bounding.bottom - (state?.mode === 'audio' ? 12 : 0)
          },
          state?.layout?.floatBarMode ? 'top' : undefined
        )
      }

      setMediaState(s => ({ ...s, labelPopoverVisible: true }))
      isPlayRef.current = !store.get(MediaStateAtom).paused
      instance.actionOps?.pause()
    }
  })
  return renderPopover({
    extra: labelDetails?.selectedText ? (
      <div className={'font-size-13 border px-3 py-2 rounded-lg mb-3 transparent-font'}>{labelDetails.selectedText}</div>
    ) : null
  })
})
