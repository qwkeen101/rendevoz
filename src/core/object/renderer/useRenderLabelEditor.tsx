import { ReactNode, useEffect, useRef, useState } from 'react'
import { Box, ILabel, XYPosition } from '~/typings'
import { AnimatePopover, AutosizeTextarea, Content, Icon, WithBorder } from '@/components'
import isHotkey from 'is-hotkey'
import { Colors, KEY } from '@/consts'
import { GlobalInstance } from '@/hooks'
import ClassName from '@/styles/classNames'
import { MetaStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'

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
  const [value, setValue] = useState('')
  const { t } = useTranslation()
  useEffect(() => {
    if (popoverState.visible) {
      const interval = setInterval(() => {
        if (inputRef.current && inputRef.current !== document.activeElement) {
          if (!document.activeElement?.closest('[role="modal-container"]')) {
            inputRef.current.focus()
          }
        }
      }, 200)
      MetaStore.addMetaObject({ id: TEMP_META_ID, type: 'temp' })
      return () => {
        clearInterval(interval)
        MetaStore.deleteMetaObject(TEMP_META_ID, { force: true })
      }
    }
  }, [popoverState.visible])
  const handleInsertNote = async (shouldClose = true) => {
    const tags = MetaStore.getCachedMetaObject(TEMP_META_ID)?.tags
    opts?.onInsert?.(value, tags)
    shouldClose && close()
  }
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
        zIndex: '5000'
      }}
      content={
        <WithBorder
          padding={'9px 8px 8px 12px'}
          style={{
            width: 470,
            maxWidth: '90vw',
            pointerEvents: popoverState.visible ? 'auto' : 'none'
          }}
        >
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
              placeholder={t('general.Add note')}
            />
            <Content flex gap={6} alignItems={'center'}>
              {opts?.showMoveTo !== false && (
                <Icon
                  name={'park-corner-up-right'}
                  style={{
                    color: Colors.Font.Transparent
                  }}
                  onClick={() => {
                    if (labelMeta?.id) {
                      GlobalInstance.metaOps?.quickAdd(labelMeta?.id)
                    } else {
                      useRenderLabelEditor.labelNeedMoveTo = true
                      handleInsertNote()
                    }
                  }}
                  size={16}
                  className={ClassName.flatButton(4, '4px')}
                />
              )}
              {opts?.showTags !== false && (
                <Icon
                  name={'park-tag-one'}
                  style={{
                    color: Colors.Font.Transparent
                  }}
                  onClick={() => {
                    GlobalInstance.metaOps?.quickAdd(labelMeta?.id ?? TEMP_META_ID, 'tags')
                  }}
                  size={16}
                  className={ClassName.flatButton(4, '4px')}
                />
              )}
              <Icon
                name={'park-up-small'}
                size={16}
                strokeWidth={5}
                onClick={handleInsertNote}
                className={ClassName.selectButton()}
                style={{
                  color: 'white',
                  padding: 3,
                  borderRadius: 999
                }}
              />
            </Content>
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
