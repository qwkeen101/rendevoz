import { Content, Icon, Image, Tooltip } from '@/components'
import { GlobalInstance, useMergedRef, useSelectAtomValue } from '@/hooks'
import useMediaState, { MediaStateAtom } from '../../hooks/useMediaState'
import { useMediaInstance } from '../../hooks/useMediaInstance'
import { useEffect, useRef } from 'react'
import { IMediaLabel } from '~/typings'
import { normalizeSecondsToTime } from '../../utils'
import Colors from '@/consts/colors'
import { MediaToolbarStateAtom } from '../../hooks/useMediaToolbarState'
import { useSetAtom } from 'jotai'
import { useRenderLabel } from '@/core'
import LabelStore from '@/api/stores/label.store'
import useRenderLabelContainer from '@/core/object/renderer/useRenderLabelContainer'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'

const MediaLabelController = ({ labelType, labelIds }: { labelType: string; labelIds?: number[] }) => {
  const [mediaState] = useMediaState()
  const { renderSort, renderContainer, renderSearch, sortedLabels } = useRenderLabelContainer(labelType, labelIds, {
    availableSorts: ['playback time', 'playback time in reverse', 'created at', 'updated at'],
    defaultSortMode: mediaState.labelSortMode ?? 'playback time',
    defaultScrollOffset: mediaState.labelScrollOffset,
    defaultPriority: mediaState.labelPriority,
    onSortModeChange: s => {
      instance.on?.({
        type: 'externalStateChange',
        state: {
          labelSortMode: s
        }
      })
    },
    onPriorityChange: p => {
      instance.on?.({
        type: 'externalStateChange',
        state: {
          labelPriority: p
        }
      })
    },
    onOffsetChange: o => {
      instance.on?.({
        type: 'externalStateChange',
        state: {
          labelScrollOffset: o
        }
      })
    }
  })
  const instance = useMediaInstance()
  const { t } = useTranslation()
  return (
    <Content
      flex
      column
      style={{
        overflow: 'hidden',
        maxHeight: '100%',
        height: '100%',
        flex: 1
      }}
    >
      {sortedLabels?.length ? (
        <>
          <Content flex gap={6} alignItems={'center'} className={'font-size-14'} style={{ padding: 12 }}>
            {renderSearch()}
            {renderSort()}
            <Tooltip positions={['left']} content={t('general.Export all labels')}>
              <Icon
                size={16}
                className={ClassName.flatButton(4, '4px')}
                onClick={() => {
                  labelIds && LabelStore.exportLabels(labelIds, labelType)
                }}
                name={'park-efferent-three'}
              />
            </Tooltip>
          </Content>
          {renderContainer(i => (
            <Label id={i.id} key={i.id} type={labelType} />
          ))}
        </>
      ) : (
        <div style={{ margin: 'auto' }} className={'bold-font transparent-font'}>
          No highlight
        </div>
      )}
    </Content>
  )
}

const Label = ({ id, type }: { id: number; type: string }) => {
  const sortedChapters = useSelectAtomValue(MediaStateAtom, s => s.sortedChapters)
  const currentFocusLabelId = useSelectAtomValue(MediaToolbarStateAtom, s => s.currentFocusLabelId)
  const containerRef = useRef<HTMLElement>(null)
  const setToolbarState = useSetAtom(MediaToolbarStateAtom)
  const instance = useMediaInstance()

  const { renderName, renderTags, renderOriginalText, renderPopover, setDraggingDetails, label, ref } = useRenderLabel({
    objectId: id,
    type,
    draggable: true,
    onNavigate: () => {
      if (mediaLabel) {
        instance.actionOps?.jumpTo(mediaLabel.time)
        instance.closeThumbnail?.()
      }
    },
    onDragStart: () => {
      setDraggingDetails({
        type,
        labelId: id
      })
    }
  })
  const mediaLabel = label as IMediaLabel
  const mergedRef = useMergedRef(containerRef, ref)
  useEffect(() => {
    if (id === currentFocusLabelId) {
      const container = containerRef.current
      if (container) {
        container.style.background = Colors.Common.SelectColorTransparent
        container.scrollIntoView({ block: 'center', behavior: 'auto' })
        setTimeout(() => {
          setToolbarState(s => ({ ...s, currentFocusLabelId: undefined }))
          container.style.removeProperty('background')
        }, 1500)
      }
    }
  }, [currentFocusLabelId])
  if (!mediaLabel) return null

  if (!label) return null
  const chapter = sortedChapters?.findLast(i => i.startTime < mediaLabel.time)
  return (
    <Content className={'border-top'} ref={mergedRef} flex column gap={12} style={{ padding: 12, transition: 'background 0.25s ease' }}>
      <Content flex gap={12} alignItems="flex-start">
        {mediaLabel?.imageUrl && (
          <Image
            onContextMenu={() => {
              mediaLabel.imageUrl && GlobalInstance.commonOps?.previewImage?.(mediaLabel.imageUrl)
            }}
            width={120}
            ratio={0.56}
            containerStyle={{
              borderRadius: 6,
              cursor: 'pointer'
            }}
            onClick={() => {
              instance.actionOps?.jumpTo(mediaLabel.time)
            }}
            src={mediaLabel.imageUrl}
          ></Image>
        )}
        <Content flex column gap={3} auto style={{ margin: 'auto' }}>
          {renderOriginalText({
            text: label.selectedText,
            style: {
              marginBottom: 4
            }
          })}
          <Content>
            {renderName({})}
            {renderPopover({
              showTag: true,
              on: e => {
                if (e.type === 'delete') {
                  instance.deleteLabel?.(id)
                }
              }
            })}
          </Content>
          <Content flex gap={8} alignItems={'flex-end'} style={{ flexWrap: 'wrap', marginTop: 4 }}>
            {renderTags()}
            <div style={{ flexShrink: 0 }} className={'font-size-12 transparent-font'}>
              {`${normalizeSecondsToTime(mediaLabel.time)}${chapter ? '  ——  ' + chapter?.name : ''}`}
            </div>
          </Content>
        </Content>
      </Content>
    </Content>
  )
}
export default MediaLabelController
