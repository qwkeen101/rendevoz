import { Content, Icon, Image } from '@/components'
import { useMergedRef, useSelectAtomValue } from '@/hooks'
import { MediaStateAtom } from '../../hooks/useMediaState'
import { ObjectStore } from '@/api/stores'
import { useMediaInstance } from '../../hooks/useMediaInstance'
import { useEffect, useRef, useState } from 'react'
import { IMediaLabel, IVideoLabel } from '~/typings'
import ClassName from '@/styles/classNames'
import { normalizeSecondsToTime } from '../../utils'
import { css } from '@emotion/css'
import FontSize from '@/consts/font'
import Colors from '@/consts/colors'
import { MediaToolbarStateAtom } from '../../hooks/useMediaToolbarState'
import { useSetAtom } from 'jotai'
import Select from '@/components/base/select'
import { VideoSidebarStateAtom } from '../../hooks/useMediaSidebarState'
import { useTranslation } from 'react-i18next'
import { useRenderLabel } from '@/core'

const MediaLabelController = ({ labelType, labelIds }: { labelType: string; labelIds?: number[] }) => {
  const [sortedLabels, setSortedLabels] = useState<number[]>()
  const [sortMode, setSortMode] = useState<'createTime' | 'videoTime'>('videoTime')
  useEffect(() => {
    const action = async () => {
      if (sortMode === 'videoTime') {
        const labels = (await Promise.all(labelIds?.map(i => ObjectStore(labelType).getOneById(i)) || [])).filter(i => i) as IVideoLabel[]
        labels.sort((b, a) => b.time - a.time)
        setSortedLabels(labels.map(i => i.id))
      } else {
        const labels = (await Promise.all(labelIds?.map(i => ObjectStore(labelType).getOneById(i)) || [])).filter(i => i) as IVideoLabel[]
        labels.sort((b, a) => b.createdAt - a.createdAt)
        setSortedLabels(labels.reverse().map(i => i.id))
      }
    }
    action()
  }, [labelIds, sortMode])
  const { t } = useTranslation()
  return (
    <Content
      flex
      column
      style={{
        overflow: 'hidden',
        maxHeight: '100%',
        flex: 1,
        paddingTop: 12
      }}
    >
      <Select
        closeOnSelect
        value={sortMode}
        className={ClassName.description()}
        onSelect={v => typeof v[0] === 'string' && setSortMode(v[0])}
        options={[
          {
            value: 'videoTime',
            children: t('general.sort by video time')
          },
          {
            value: 'createTime',
            children: t('general.sort by create time')
          }
        ]}
      ></Select>
      <Content
        flex
        column
        style={{
          paddingRight: 12,
          overflowY: 'auto',
          height: '100%'
        }}
        className={css({
          '>': {
            ':not(:last-child)': {
              borderBottom: `1px solid ${Colors.Background.Border}`
            }
          }
        })}
      >
        {sortedLabels?.map(i => <Label id={i} key={i} type={labelType} />)}
      </Content>
    </Content>
  )
}

const Label = ({ id, type }: { id: number; type: string }) => {
  const sortedChapters = useSelectAtomValue(MediaStateAtom, s => s.sortedChapters)
  const currentFocusLabelId = useSelectAtomValue(MediaToolbarStateAtom, s => s.currentFocusLabelId)
  const containerRef = useRef<HTMLElement>(null)
  const setToolbarState = useSetAtom(MediaToolbarStateAtom)
  const instance = useMediaInstance()

  const { renderName, renderAttachment, renderDescription, renderPopover, setDraggingDetails, label, ref } = useRenderLabel({
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
        container.scrollIntoView({ block: 'center' })
        container.style.borderRadius = '8px'
        container.style.outline = `1px solid ${Colors.Emphasis.Emphasis}`
        setTimeout(() => {
          setToolbarState(s => ({ ...s, currentFocusLabelId: undefined }))
          container.style.removeProperty('outline')
          container.style.removeProperty('border-radius')
        }, 1500)
      }
    }
  }, [currentFocusLabelId])
  if (!mediaLabel) return null
  if (!mediaLabel.time && mediaLabel.videoTime) {
    ObjectStore(type).updateOne({ id, time: mediaLabel.videoTime })
  }

  if (!label) return null
  const chapter = sortedChapters?.findLast(i => i.startTime < mediaLabel.time)
  return (
    <Content ref={mergedRef} flex column gap={8} style={{ padding: '10px 0px 10px 6px' }}>
      <Content flex gap={12} alignItems="flex-start">
        {mediaLabel?.imageUrl && (
          <Image
            width={100}
            preview
            ratio={0.5625}
            containerStyle={{
              borderRadius: 8
            }}
            src={mediaLabel.imageUrl}
          ></Image>
        )}
        <Content flex column auto style={{ margin: 'auto' }}>
          {renderName({})}
          <div style={{ flexShrink: 0 }} className={ClassName.description(FontSize['11px'])}>
            {`${normalizeSecondsToTime(mediaLabel.time)}${chapter ? '  ——  ' + chapter?.name : ''}`}
          </div>
        </Content>
        {renderPopover({
          on: e => {
            if (e.type === 'delete') {
              instance.deleteLabel?.(id)
            }
          }
        })}
      </Content>
      {renderDescription({})}
      {renderAttachment({})}
    </Content>
  )
}
export default MediaLabelController
