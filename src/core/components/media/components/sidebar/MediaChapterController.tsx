import { Button, Content, Icon, IconWithPopover, WithBorder } from '@/components'
import { useMediaInstance } from '../../hooks/useMediaInstance'
import useMediaState from '../../hooks/useMediaState'
import ClassName from '@/styles/classNames'
import Colors from '@/consts/colors'
import { normalizeSecondsToTime } from '../../utils'
import { useMemo, useRef, useState } from 'react'
import { IMediaChapter } from '~/typings'
import FontSize from '@/consts/font'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'

const MediaChapterController = () => {
  const [mediaState] = useMediaState()
  console.log(mediaState.sortedChapters)
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
      <Content flex column style={{ overflowY: 'auto', paddingRight: 8 }}>
        {mediaState.sortedChapters?.map((i, idx, arr) => (
          <Chapter canDelete={i.startTime === 0 ? arr.length === 1 : true} chapter={i} key={i.id} />
        ))}
      </Content>
    </Content>
  )
}

const Chapter = ({ chapter, canDelete }: { chapter: IMediaChapter; canDelete: boolean }) => {
  const instance = useMediaInstance()
  const [mediaState] = useMediaState()
  const [chapterState, setChapterState] = useState<{
    hovered: boolean
    playing: boolean
    editingName: boolean
    chapterRgb?: [number, number, number]
  }>({
    hovered: false,
    playing: false,
    editingName: false
  })
  const nextChapter = useMemo(
    () => mediaState.sortedChapters?.find(i => i.startTime > chapter.startTime),
    [mediaState.sortedChapters?.length]
  )
  const { hovered, playing, editingName, chapterRgb } = chapterState
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
    <Content
      flex
      onPointerEnter={e => {
        setChapterState(s => (s.hovered ? s : { ...s, hovered: true }))
      }}
      onPointerMove={e => {
        setChapterState(s => (s.hovered ? s : { ...s, hovered: true }))
      }}
      onPointerLeave={e => setChapterState(s => ({ ...s, hovered: false }))}
      gap={12}
      alignItems="center"
      style={{
        padding: 8,
        background: isPlaying
          ? chapterRgb
            ? `rgba(${chapterRgb[0]},${chapterRgb[1]},${chapterRgb[2]},0.2)`
            : Colors.Background.ButtonHover
          : undefined
      }}
      onClick={e => {
        instance.actionOps?.jumpTo?.(chapter.startTime)
      }}
      className={ClassName.flatButton(0)}
    >
      {chapter.imageUrl && (
        <div
          style={{
            width: 100,
            height: 56,
            borderRadius: 8,
            flexShrink: 0,
            overflow: 'hidden'
          }}
        >
          <img draggable={false} src={chapter.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }}></img>
        </div>
      )}
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
              className={ClassName.noStyleInput}
              ref={inputRef}
              defaultValue={chapter.name}
              onKeyDown={e => {
                if (isHotkey(KEY.Enter, e)) {
                  handleChangeName()
                }
              }}
            ></input>
            <Icon containerStyle={{ flexShrink: 0 }} onClick={handleChangeName} className={ClassName.circleButton(2)} name="park-check" />
          </Content>
        ) : (
          <div className={css([ClassName.title(FontSize['14px']), ClassName.ellipsisFont(3)])} style={{ width: 'fit-content' }}>
            {chapter.name}
          </div>
        )}
        <div
          className={ClassName.description()}
          style={{
            background: Colors.Background.ButtonHover,
            padding: '2px 6px',
            borderRadius: 2,
            lineHeight: 1.1,
            width: 'fit-content',
            fontSize: FontSize['12px']
          }}
        >
          {normalizeSecondsToTime(chapter.startTime)}
        </div>
      </Content>
      <IconWithPopover
        name="park-more"
        disableIntersection
        className={ClassName.circleButton()}
        disableNudge
        placement={['right', 'left']}
        align="center"
        closeOnContentClick
        onClick={e => e.stopPropagation()}
        onContentClick={e => e.stopPropagation()}
        content={
          <WithBorder padding={8} style={{ width: 160 }}>
            <Button.IconButton
              text={t('general.edit name')}
              icon="park-edit"
              onClick={() => setChapterState(s => ({ ...s, editingName: true }))}
            ></Button.IconButton>
            {canDelete && (
              <Button.IconButton
                dangerous
                text={t('general.delete')}
                icon="park-delete"
                onClick={() => instance.deleteChapter?.(chapter.id)}
              ></Button.IconButton>
            )}
          </WithBorder>
        }
      ></IconWithPopover>
    </Content>
    // </DraggableElement>
  )
}

export default MediaChapterController
