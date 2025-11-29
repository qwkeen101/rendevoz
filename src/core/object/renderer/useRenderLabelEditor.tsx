import { ReactNode, useEffect, useRef, useState } from 'react'
import { Box, ILabel, XYPosition } from '~/typings'
import { AnimatePopover, AutosizeTextarea, Content, Icon, IconWithPopover, WithBorder } from '@/components'
import isHotkey from 'is-hotkey'
import { Icons, KEY, Shortcuts, Zindexes } from '@/consts'
import { useMemoizedFn } from '@/hooks'
import ClassName from '@/styles/classNames'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import { useLatest } from 'react-use'

const TEMP_META_ID = 10001
const attchedTags: Record<number, number[]> = {}
const useRenderLabelEditor = function <T extends ILabel>(opts?: {
  onClose?: VoidFunction
  onInsert?: (name: string, tags?: number[]) => void
  onCancel?: VoidFunction
  parentElement?: HTMLElement | null
  showTags?: boolean
  showMoveTo?: boolean
}) {
  const inputRef = useRef<HTMLDivElement>(null)
  const [popoverState, setPopoverState] = useState<{
    visible: boolean
    position?: XYPosition
    labelDetails?: Partial<T>
    direction?: 'top' | 'bottom'
  }>({
    visible: false
  })
  const { visible, position, labelDetails, direction = 'bottom' } = popoverState
  const labelMeta = MetaStore.useObjectToMetaValue(labelDetails?.id)
  const [tagVisible, setTagVisible] = useState(false)
  const [value, setValue] = useState('')
  const [tempTags, setTempTags] = useState<number[]>([])
  const { t } = useTranslation()
  const latestTagVisible = useLatest(tagVisible)
  useEffect(() => {
    if (popoverState.visible) {
      setTempTags([])
      const keydownHandler = (e: KeyboardEvent) => {
        if (isHotkey('mod+t', e)) {
          setTagVisible(s => !s)
        }
      }
      document.addEventListener('keydown', keydownHandler)
      const interval = setInterval(() => {
        if (inputRef.current && inputRef.current !== document.activeElement) {
          if (!latestTagVisible.current) {
            inputRef.current.focus()
          }
        }
      }, 200)
      MetaStore.addMetaObject({ id: TEMP_META_ID, type: 'temp', temp: true, hidden: true })
      return () => {
        clearInterval(interval)
        document.removeEventListener('keydown', keydownHandler)
        MetaStore.deleteMetaObject(TEMP_META_ID, { force: true })
        setTagVisible(false)
      }
    }
  }, [popoverState.visible])
  const handleInsertNote = useMemoizedFn(async (shouldClose = true) => {
    opts?.onInsert?.(value, tempTags)
    shouldClose && close()
  })
  const renderPopover = (options?: { extra?: ReactNode }) => (
    <AnimatePopover
      keyboardClose={false}
      positions={direction === 'bottom' ? ['bottom', 'top'] : ['top', 'bottom']}
      visible={!!(visible && position)}
      position={{
        left: position?.x ?? 0,
        top: position?.y ?? 0
      }}
      onClickOutside={() => {
        close()
        if (!labelMeta) {
          opts?.onCancel?.()
        }
      }}
      parentElement={opts?.parentElement}
      withClickCover
      containerStyle={{
        zIndex: String(Zindexes.LabelEditor)
      }}
      content={
        <WithBorder
          className="p-3"
          style={{
            width: 470,
            maxWidth: '90vw',
            pointerEvents: popoverState.visible ? 'auto' : 'none'
          }}
        >
          <div className="mb-3 font-bold">添加标注</div>
          {options?.extra}
          <Content
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              alignItems: 'center',
              justifyContent: 'flex-end'
            }}
          >
            <AutosizeTextarea
              ref={inputRef}
              style={{
                flexGrow: 1,
                paddingLeft: 3,
                width: value.length && value.includes('\n') ? '100%' : undefined
              }}
              value={value}
              onChange={e => {
                setValue(e)
              }}
              autoFocus
              onKeyDown={e => {
                if (isHotkey(KEY.Enter, e)) {
                  e.preventDefault()
                  handleInsertNote()
                }
                if (isHotkey(KEY.Escape, e)) {
                  close()
                  if (!labelMeta) {
                    opts?.onCancel?.()
                  }
                }
              }}
              placeholder={`${t('general.Add note')}...`}
            />
            <Icon
              name={'park-up-small'}
              size={16}
              strokeWidth={5}
              onClick={handleInsertNote}
              className="reverse-theme-button"
              style={{
                padding: 3,
                borderRadius: 999
              }}
            />
          </Content>
        </WithBorder>
      }
    />
  )
  const close = () => {
    setPopoverState(s => ({ ...s, visible: false }))
    opts?.onClose?.()
  }
  const attachTags = (labelId: number, tags: number[]) => {
    attchedTags[labelId] = tags
  }
  const open = (labelDetails: Partial<T>, box: Box, direction?: 'top' | 'bottom') => {
    if (labelDetails.name) {
      setValue(labelDetails.name)
    } else {
      setValue('')
    }
    setPopoverState({
      visible: true,
      position: {
        x: box.left + box.width / 2,
        y: box.top + box.height + 10
      },
      direction,
      labelDetails
    })
  }
  return {
    labelDetails,
    renderPopover,
    open,
    attachTags
  }
}
useRenderLabelEditor.attachedTags = attchedTags
useRenderLabelEditor.labelNeedMoveTo = false
useRenderLabelEditor.TEMP_ID = TEMP_META_ID
export default useRenderLabelEditor as typeof useRenderLabelEditor & {
  // label id => tags
  attachedTags: Record<number, number[]>
  TEMP_ID: number
  labelNeedMoveTo?: boolean
}
