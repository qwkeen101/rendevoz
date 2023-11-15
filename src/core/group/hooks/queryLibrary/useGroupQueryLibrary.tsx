import { ObjectStore } from '@/api/stores'
import { useState } from 'react'
import { Modal } from '@/components'
import QueryPanel from '@/core/group/hooks/queryLibrary/QueryPanel'

const useGroupQueryLibrary = (groupId: number) => {
  const [visible, setVisible] = useState(false)

  const renderPanel = () => {
    return (
      <Modal visible={visible} onClose={() => setVisible(false)}>
        <QueryPanel onClose={() => setVisible(false)} groupId={groupId} />
      </Modal>
    )
  }
  return {
    open: () => setVisible(true),
    renderPanel
  }
}

export default useGroupQueryLibrary
