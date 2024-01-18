import { ObjectStore } from '@/api/stores'
import { useState } from 'react'
import { Modal } from '@/components'
import QueryPanel from '@/core/components/group/components/queryLibrary/QueryPanel'
import { MetaGroup } from '~/typings'

const useGroupQueryLibrary = (groupValue?: MetaGroup) => {
  const [visible, setVisible] = useState(false)

  const renderPanel = () => {
    return (
      <Modal zIndex={5000} visible={visible} onClose={() => setVisible(false)}>
        <QueryPanel onClose={() => setVisible(false)} groupValue={groupValue} />
      </Modal>
    )
  }
  return {
    open: () => setVisible(true),
    renderPanel
  }
}

export default useGroupQueryLibrary
