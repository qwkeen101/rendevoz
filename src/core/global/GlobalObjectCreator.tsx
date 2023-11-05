import { assignProperties } from '@/utils'
import { GlobalInstance } from '@/hooks'
import { useRef, useState } from 'react'
import { Modal } from '@/components'
import FileImporter from '@/components/fileImporter'

export default () => {
  const [visible, setVisible] = useState(false)
  const callbackRef = useRef<{
    resolve: typeof Promise.resolve
    reject: typeof Promise.reject
  }>()
  assignProperties(GlobalInstance, {
    metaOps: {
      ...GlobalInstance.metaOps,
      createObject: () => {
        setVisible(true)
        return new Promise((resolve, reject) => {
          callbackRef.current = {
            reject,
            resolve
          }
        })
      }
    }
  })
  return (
    <Modal visible={visible} onClose={() => setVisible(false)}>
      <FileImporter
        onClose={() => setVisible(false)}
        onCreate={object => {
          callbackRef.current?.resolve(object)
          setTimeout(() => {
            callbackRef.current = undefined
          })
        }}
        autoOpen={false}
      />
    </Modal>
  )
}
