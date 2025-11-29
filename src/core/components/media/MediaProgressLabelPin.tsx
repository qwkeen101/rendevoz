import { MetaStore, ObjectStore } from '@/api/stores'
import { MediaStateAtom } from './hooks/useMediaState'
import { useSelectAtomValue } from '@/hooks'
import { Icon, Tooltip, WithBorder } from '@/components'
import { MediaToolbarStateAtom } from './hooks/useMediaToolbarState'
import { useSetAtom } from 'jotai'
import { useMediaInstance } from './hooks/useMediaInstance'
import { memo } from 'react'
import { Colors } from '@/consts'
import { DraggableElement } from '@/core'
import { IMediaLabel } from '~/typings'
import { isEqual } from 'lodash'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import classnames from 'classnames'

const MediaProgressLabelPin = memo(({ labelId }: { labelId: number }) => {
  const { totalTime, labelType, mode } = useSelectAtomValue(
    MediaStateAtom,
    s => ({
      totalTime: s.totalTime,
      labelType: s.labelType,
      mode: s.mode
    }),
    {
      compare: isEqual
    }
  )
  const border = mode === 'audio' ? '2px solid var(--font-primary)' : `2px solid ${Colors.Font.White}`
  const mediaLabel = ObjectStore(labelType).useValue(labelId) as IMediaLabel | undefined
  const labelMeta = MetaStore.useObjectToMetaValue(labelId)
  const instance = useMediaInstance()
  if (!mediaLabel || !totalTime) return null
  if (labelMeta?.deleted) return null

  const { time, imageUrl, name, selectedText } = mediaLabel
  return (
    <Tooltip
      style={{ whiteSpace: 'pre-wrap' }}
      disableDefaultContent
      content={
        <WithBorder className={'flex flex-col max-w-72 overflow-hidden'} borderRadius={4}>
          {imageUrl && <img src={imageUrl} className={'w-72'} />}
          <div className={classnames('min-w-36', imageUrl ? 'p-2' : 'p-1.5')}>
            <div className={'font-mono text-xs leading-none transparent-font'}>{normalizeSecondsToTime(time)}</div>
            {selectedText && (
              <div
                className={'text-xs whitespace-pre-wrap transparent-font pl-1.5 py-0.5 mt-1 mb-0.5'}
                style={{
                  borderLeft: '2px solid var(--emphasis)'
                }}
              >
                {selectedText}
              </div>
            )}
            <div className={'primary-font text-sm max-w-64 break-words whitespace-pre-wrap'}>{name}</div>
          </div>
        </WithBorder>
      }
    >
      <div
        onClick={() => {
          instance.actionOps?.jumpTo(time)
        }}
        className={'rounded-full'}
        style={{
          position: 'absolute',
          top: '50%',
          pointerEvents: 'auto',
          left: `${(time / totalTime) * 100}%`,
          zIndex: 50,
          transform: `translateX(-50%) translateY(-50%)`,
          cursor: 'pointer',
          height: 10,
          width: 10,
          border: border,
          background: mode === 'audio' ? 'var(--global-background)' : Colors.Background.Dark
        }}
      ></div>
    </Tooltip>
  )
})

export default MediaProgressLabelPin
