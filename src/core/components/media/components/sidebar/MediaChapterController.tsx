import { Button, Content, IconWithPopover, WithBorder } from '@/components'
import { useMediaInstance } from '../../hooks/useMediaInstance'
import useMediaState from '../../hooks/useMediaState'
import Colors from '@/consts/colors'
import { normalizeSecondsToTime } from '../../utils'
import { useMemo, useRef, useState } from 'react'
import { IMediaChapter } from '~/typings'
import isHotkey from 'is-hotkey'
import { Icons, KEY } from '@/consts'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import trans from '@/consts/trans'
import EmptyList from '@/core/components/common/EmptyList'

const MediaChapterController = () => {
  const [mediaState] = useMediaState()
  return (
    <Content
      flex
      column
      style={{
        overflow: 'hidden',
        height: '100%',
        padding: 12
      }}
    >
      <Content flex column style={{ overflowY: 'auto', height: '100%' }}>
        {mediaState.sortedChapters?.length ? (
          mediaState.sortedChapters?.map((i, idx, arr) => (
            <Chapter canDelete={i.startTime === 0 ? arr.length === 1 : true} chapter={i} key={i.id} />
          ))
        ) : (
          <EmptyList className={'flex-1'} />
        )}
      </Content>
    </Content>
  )
}

const Chapter = ({ chapter, canDelete }: { chapter: IMediaChapter; canDelete: boolean }) => {
  const instance = useMediaInstance()
  const [mediaState] = useMediaState()
  const [chapterState, setChapterState] = useState<{
    playing: boolean
    editingName: boolean
  }>({
    playing: false,
    editingName: false
  })
  const nextChapter = useMemo(
    () => mediaState.sortedChapters?.find(i => i.startTime > chapter.startTime),
    [mediaState.sortedChapters?.length]
  )
  const { editingName } = chapterState
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  const roundedCurrentTime = Math.round(mediaState.currentTime || 0)
  const roundedStartTime = Math.round(chapter.startTime)
  const roundedNextStartTime = Math.round(nextChapter?.startTime || 0)
  const isPlaying = roundedCurrentTime >= roundedStartTime && (nextChapter ? roundedCurrentTime < roundedNextStartTime : true)
  const handleChangeName = () => {
    const input = inputRef.current
    setChapterState(s => ({ ...s, editingName: false }))
    if (input) {
      instance.updateChapter?.({ id: chapter.id, name: input.value })
    }
  }

  return (
    <div
      onClick={() => {
        instance.actionOps?.jumpTo?.(chapter.startTime ?? 0)
      }}
      className={classnames('button flex gap-3 items-start !p-2', isPlaying && 'active-button')}
    >
      <Content flex column auto gap={4}>
        {editingName ? (
          <Content
            onClick={e => e.stopPropagation()}
            style={{
              padding: '2px 4px',
              borderRadius: 6
            }}
            className={'focus-within-input'}
            flex
            alignItems="center"
          >
            <input
              style={{
                flex: 1,
                width: '100%'
              }}
              autoFocus
              ref={inputRef}
              defaultValue={chapter.name}
              onKeyDown={e => {
                if (isHotkey(KEY.Enter, e)) {
                  e.preventDefault()
                  handleChangeName()
                }
              }}
            ></input>
          </Content>
        ) : (
          <div className={'ellipsis-font-3 normal-font'} style={{ width: 'fit-content' }}>
            {chapter.name || t(trans.Unnamed)}
          </div>
        )}
        <div
          className={'font-size-12 transparent-font'}
          style={{
            background: Colors.Background.ButtonHover,
            padding: '2px 6px',
            borderRadius: 2,
            lineHeight: 1.1,
            width: 'fit-content'
          }}
        >
          {normalizeSecondsToTime(chapter.startTime)}
        </div>
      </Content>
      <IconWithPopover
        name={Icons.More}
        className={'hover-active-button'}
        size={18}
        disableNudge
        placement={['right', 'left']}
        align="center"
        closeOnContentClick
        onClick={e => e.stopPropagation()}
        onContentClick={e => e.stopPropagation()}
        content={
          <WithBorder className={'p-1 min-w-48'}>
            <Button.IconButton
              text={t(trans.Edit)}
              icon={Icons.Edit}
              onClick={() => setChapterState(s => ({ ...s, editingName: true }))}
            ></Button.IconButton>
            {canDelete && (
              <Button.IconButton
                text={t(trans.Delete)}
                icon={Icons.Delete}
                onClick={() => instance.deleteChapter?.(chapter.id)}
              ></Button.IconButton>
            )}
          </WithBorder>
        }
      ></IconWithPopover>
    </div>
  )
}

export default MediaChapterController
