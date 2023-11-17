import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useEffect } from 'react'
import useGroupDeleteKey from '@/core/components/group/hooks/keyboard/useGroupDeleteKey'

const useGroupGlobalKey = () => {
  const instance = useGroupInstance()
  const handleDeleteKey = useGroupDeleteKey(instance)
  useEffect(() => {
    const keyboardHandler = (e: KeyboardEvent) => {
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
