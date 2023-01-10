import { useToggle } from '@/hooks'
import { useState } from 'react'
import Modal from '../base/modal'
import EditMetaObjectForm from '../form/EditMetaObjectForm'
import NewCollectionForm from '../form/NewCollectionForm'

type FormType = 'collection' | 'metaObject'

const GlobalFormOverlayInstance: Partial<{
  close: VoidFunction
  open: (formType: FormType) => void
  changeSize: (width: number, height: number) => void
}> = {}

const GlobalFormOverlay = () => {
  const [visible, toggleVisible] = useToggle(false)
  const [formType, setFormType] = useState<FormType>()
  const [size, setSize] = useState({ width: 300, height: 300 })
  Object.assign(GlobalFormOverlayInstance, {
    close: toggleVisible(false),
    open: t => setFormType(t),
    changeSize: (width, height) => setSize({ width, height })
  } as typeof GlobalFormOverlayInstance)
  const renderContent = () => {
    switch (formType) {
      case 'collection':
        return <NewCollectionForm />
      case 'metaObject':
        return <EditMetaObjectForm />
    }
    return null
  }
  return (
    <Modal width={size.width} height={size.height} visible={visible} onClose={toggleVisible}>
      {renderContent()}
    </Modal>
  )
}

export default GlobalFormOverlay
