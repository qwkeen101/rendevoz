import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { assignProperties } from '@/utils'
import { useEffect, useRef } from 'react'
import isHotkey from 'is-hotkey'
import { applyPatchesOnAtom } from '@/api/stores/history.store'
import { GroupHistoryItem, IGlobalEvents } from '~/typings'

/**
 * 组历史有两种情况：1.对objectstore或metasore更改，2.更改组属性
 */
const useGroupHistory = (groupId?: number) => {
  const instance = useGroupInstance()
  const lastTriggered = useRef<undefined | NodeJS.Timeout>()
  const updateQueuesRef = useRef<GroupHistoryItem[]>([])
  const handleUndo = () => {
    const last = instance.values.undos.pop()
    if (last) {
      last.forEach(l => {
        applyPatchesOnAtom(l.atom, l.inversePatches, l.databaseName)
      })
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
    Global.addEventListener('databaseChange', handleDatabaseChange)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
      Global.removeEventListener('databaseChange', handleDatabaseChange)
    }
  })
  const handleDatabaseChange = (data: IGlobalEvents['databaseChange']) => {
    if (lastTriggered.current) {
      const items = updateQueuesRef.current
      // only listen to meta object's history
      if (data.databaseName === 'metaObjects') {
        items.push({
          ...data
        })
      }
      if (data.databaseName === 'objects') {
        if (data.patches.some(i => i.value.specType === 'group' && i.value.id === groupId)) {
          items.push({ ...data })
        }
      }
      console.log(items)
    }
  }
  assignProperties(instance, {
    triggerChange: () => {
      if (lastTriggered.current) {
        clearTimeout(lastTriggered.current)
      }
      lastTriggered.current = setTimeout(() => {
        lastTriggered.current = undefined
        instance.values.undos.push(updateQueuesRef.current)
        updateQueuesRef.current = []
      })
    }
  })
}

export default useGroupHistory
