import { Icon, WithBorder } from '@/components'
import isHotkey from 'is-hotkey'
import { Icons, KEY } from '@/consts'
import BlockColorPicker from '@/core/components/editor/components/BlockColorPicker'
import { ObjectStore } from '@/api/stores'
import { useEffect, useRef } from 'react'

export default ({ id, onClose }: { id: number; onClose?: VoidFunction }) => {
  const tag = ObjectStore('tag').useValue(id)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (tag) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 120)
    }
  }, [tag?.id])
  if (!tag) return null
  return (
    <WithBorder onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} padding={10}>
      <div className={'mb-2 flex gap-3 items-center'}>
        <input
          ref={inputRef}
          defaultValue={tag.name}
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              e.currentTarget.blur()
              e.preventDefault()
              onClose?.()
            }
          }}
          onBlur={e => {
            console.log(e)
            const v = e.currentTarget.value
            if (v !== tag.name) {
              ObjectStore('tag').updateOne({ id, name: e.currentTarget.value })
            }
          }}
          className={'font-size-13 focus-input border-box-shadow flex-1 rounded py-1 px-2'}
        />
        <Icon
          name={Icons.Delete}
          onClick={() => {
            onClose?.()
            ObjectStore('tag').deleteOneById(id)
            const tab = Global.layoutOps?.hasTargetTab({
              type: 'tagGroup',
              objectId: id
            })
            if (tab) {
              Global.layoutOps?.closeTab(tab)
            }
          }}
          size={16}
          className={'square-button-small'}
        />
      </div>
      <BlockColorPicker
        style={{
          padding: 0,
          boxShadow: 'none',
          border: 'none'
        }}
        bgBackDefault={false}
        showFont={false}
        onPickBackgroundColor={c => {
          onClose?.()
          ObjectStore('tag').updateOne({ id, color: c })
        }}
      />
    </WithBorder>
  )
}
