import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import { assignProperties } from '@/utils'
import { useEffect, useRef } from 'react'
import { Rendevoz } from '@/core/rendevoz'
import isHotkey from 'is-hotkey'
import { applyPatchesOnAtom } from '@/api/stores/history.store'

/**
 * 组历史有两种情况：1.对objectstore或metasore更改，2.更改组属性
 */
const useGroupHistory = (groupId: number) => {
  const instance = useGroupInstance()
  const lastTriggered = useRef<undefined | number>(0)
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = Rendevoz.Events.Emit.useEventHandler('global')
  const handleUndo = () => {
    const last = instance.values.undos.pop()
    console.log(last)
    if (last) {
      applyPatchesOnAtom(last.atom, last.inversePatches, last.databaseName)
    }
  }
  const handleRedo = () => {}
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (!instance.values.isFocused) return
      if (isHotkey('mod+z', e)) {
        handleUndo()
      }
      if (isHotkey('mod+y', e)) {
        handleRedo()
      }
    }
    document.addEventListener('keydown', keydownHandler)
    emitter.addListener('global', handler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
      emitter.removeListener('global', handler)
    }
  })
  handler.on('globalValueChange', data => {
    if (lastTriggered.current) {
      console.log(data)
      // only listen to meta object's history
      if (data.databaseName === 'metaObjects') {
        instance.values.undos.push({
          ...data
        })
      }
      if (data.databaseName === 'objects') {
        if (data.patches.some(i => i.value.specType === 'group' && i.value.id === groupId)) {
          instance.values.undos.push({ ...data })
        }
      }
    }
  })
  assignProperties(instance, {
    triggerChange: () => {
      lastTriggered.current = Date.now()
      setTimeout(() => {
        lastTriggered.current = undefined
      })
    }
  })
}

export default useGroupHistory
