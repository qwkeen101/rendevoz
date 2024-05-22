import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useEffect } from 'react'
import useGroupDeleteKey from '@/core/components/group/hooks/keyboard/useGroupDeleteKey'
import useGroupTableControlCell from '@/core/components/group/hooks/keyboard/useGroupTableControlCell'
import useGroupTableRowControl from '@/core/components/group/hooks/keyboard/useGroupTableRowControl'
import useGroupEscKey from '@/core/components/group/hooks/keyboard/useGroupEscKey'
import useGroupCommonActions from '@/core/components/group/hooks/keyboard/useGroupCommonActions'

const useGroupGlobalKey = () => {
  const instance = useGroupInstance()
  const handleDeleteKey = useGroupDeleteKey(instance)
  const handleTableCellControlKey = useGroupTableControlCell(instance)
  const handleTableRowControlKey = useGroupTableRowControl(instance)
  const handleEscKey = useGroupEscKey(instance)
  const handleCommonKey = useGroupCommonActions(instance)
  useEffect(() => {
    const keyboardHandler = (e: KeyboardEvent) => {
      // timeout here to ensure high priorty work first
      setTimeout(() => {
        if (e.defaultPrevented) {
          return
        }
        if (!instance.values.isFocused) return
        handleCommonKey(e)
        handleTableCellControlKey(e)
        handleTableRowControlKey(e)
        handleEscKey(e)
        handleDeleteKey(e)
      })
    }
    document.addEventListener('keydown', keyboardHandler)
    return () => {
      document.removeEventListener('keydown', keyboardHandler)
    }
  })
}

export default useGroupGlobalKey
