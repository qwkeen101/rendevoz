import { Modal } from '@/components'
import { GlobalSearchInputAtom, SearchDialog } from '../../search/SearchDialog'
import { GlobalInstance, useGlobalSetAtom, useToggle } from '@/hooks'
import { memo, useEffect } from 'react'
import { assignProperties } from '@/utils'

const TextSearch = memo(() => {
  const [modalVisible, toggleModalVisible] = useToggle(false)
  const setSearchInput = useGlobalSetAtom(GlobalSearchInputAtom)
  assignProperties(GlobalInstance, {
    searchOps: {
      openSearchPanel: query => {
        if (query) {
          setSearchInput(query)
        }
        toggleModalVisible(true)
      },
      closeSearchPanel: () => {
        toggleModalVisible(false)
      }
    }
  })
  useEffect(() => {
    if (modalVisible) {
      setTimeout(() => {
        document.getElementById('global-search-input')?.focus()
      }, 100)
    } else {
      document.getElementById('global-search-input')?.blur()
    }
  }, [modalVisible])
  return (
    <Modal enableClickEvent zIndex={1000} disableAnimation notUnmount noStyle visible={modalVisible} onClose={toggleModalVisible}>
      <SearchDialog onClose={toggleModalVisible} visible={modalVisible} />
    </Modal>
  )
})

export default TextSearch
