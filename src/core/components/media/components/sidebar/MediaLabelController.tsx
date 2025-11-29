import { useMergedRef } from '@/hooks'
import { useSelectMediaState } from '../../hooks/useMediaState'
import { useMediaInstance } from '../../hooks/useMediaInstance'
import { useRef } from 'react'
import { IMediaLabel } from '~/typings'
import { useRenderLabel } from '@/core'
import useRenderLabelContainer from '@/core/object/renderer/useRenderLabelContainer'
import ContextMenu from '@/components/contextMenu'

const MediaLabelController = () => {
  const labelState = useSelectMediaState(s => ({
    labelFolders: s.labelFolders,
    labelFilter: s.labelFilter,
    labelPriority: s.labelPriority,
    labelScrollOffset: s.labelScrollOffset,
    labelSortMode: s.labelSortMode,
    labelIds: s.labels,
    labelType: s.labelType
  }))
  const { labelIds, labelType } = labelState
  const { renderContainer, renderHeader } = useRenderLabelContainer(labelType, {
    labelIds,
    labelState,
    onDelete: id => {
      instance.deleteLabel?.(id)
    },
    onLabelStateChange: s => {
      console.log(s)
      instance.on?.({ type: 'externalStateChange', state: { ...s } })
    },
    availableSorts: ['playback time', 'playback time in reverse', 'created at', 'updated at']
  })
  const instance = useMediaInstance()
  const sortMode = labelState.labelSortMode
  const showTime = sortMode === 'playback time' || sortMode === 'playback time in reverse'
  return (
    <div className={'overflow-hidden max-h-full h-full flex-1 flex flex-col'}>
      {renderHeader()}
      {renderContainer((i, highlighted, onMove) => (
        <Label highlighted={highlighted} onMove={onMove} showTime={showTime} id={i.id} key={i.id} type={labelType} />
      ))}
    </div>
  )
}

const Label = ({
  id,
  type,
  onMove,
  showTime,
  highlighted
}: {
  id: number
  type: string
  showTime: boolean
  onMove: VoidFunction
  highlighted: boolean
}) => {
  const containerRef = useRef<HTMLElement>(null)
  const instance = useMediaInstance()

  const { renderName, renderContextMenu, renderTags, renderQuestions, renderHeader, renderOriginalText, label, ref, labelMeta } =
    useRenderLabel({
      objectId: id,
      type,
      onMove,
      onDelete: () => {
        instance.deleteLabel?.(id)
      }
    })
  const mediaLabel = label as IMediaLabel
  const mergedRef = useMergedRef(containerRef, ref)

  if (!mediaLabel) return null
  if (labelMeta?.deleted) return null
  return (
    <ContextMenu ref={mergedRef} content={setV => renderContextMenu(undefined, () => setV(false))}>
      <div
        onClick={e => {
          if (!e.defaultPrevented) {
            if (!window.getSelection()?.toString()) {
              if (mediaLabel) {
                instance.actionOps?.jumpTo(mediaLabel.time)
              }
            }
          }
        }}
        className={'flex flex-col p-3.5 gap-3 light-hover transition-colors'}
      >
        {renderHeader({ showTime })}
        {mediaLabel?.imageUrl && (
          <img
            className={'object-cover w-full rounded-xl aspect-video'}
            style={{
              maxWidth: 300
            }}
            src={mediaLabel.imageUrl}
          ></img>
        )}
        {renderOriginalText({
          hideIfImage: false,
          text: mediaLabel.selectedText || ''
        })}
        {renderName({ defaultVisible: mediaLabel.imageUrl || mediaLabel.selectedText ? false : true })}
        {renderTags()}
        {renderQuestions()}
      </div>
    </ContextMenu>
  )
}
export default MediaLabelController
