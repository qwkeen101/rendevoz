import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useEffect } from 'react'
import useGroupDeleteKey from '@/core/components/group/hooks/keyboard/useGroupDeleteKey'
import useGroupTableControlCell from '@/core/components/group/hooks/keyboard/useGroupTableControlCell'
import useGroupTableRowControl from '@/core/components/group/hooks/keyboard/useGroupTableRowControl'

const useGroupGlobalKey = () => {
  const instance = useGroupInstance()
  const handleDeleteKey = useGroupDeleteKey(instance)
  const handleTableCellControlKey = useGroupTableControlCell(instance)
  const handleTableRowControlKey = useGroupTableRowControl(instance)
  useEffect(() => {
    const keyboardHandler = (e: KeyboardEvent) => {
      handleTableCellControlKey(e)
      handleTableRowControlKey(e)
      if (!instance.values.isFocused) return
      handleDeleteKey(e)
    }
    document.addEventListener('keydown', keyboardHandler)
    return () => {
      document.removeEventListener('keydown', keyboardHandler)
    }
  })
}

export default useGroupGlobalKey
