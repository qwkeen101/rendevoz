import { useToggle } from '@/hooks'
import useLatest from '@/hooks/utils/useLatest'
import useCollectionStore from '@/stores/collection.store'
import createDocumentStore from '@/stores/document.store'
import useLabelStore from '@/stores/label.store'
import { metaStore, noteStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { exportRendevozDb, importRendevozDb } from '@/utils/db'
import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Content, Form, Icon } from '../base'
import Modal from '../base/Modal'
import useFileUpload from '../base/useFileUpload'
import SettingItem from './Item'

const GeneralSetting = () => {
  const [isExporting, toggleIsExporting] = useToggle(false)
  const [isImporting, toggleIsImporting] = useToggle(false)
  const [alertVisible, toggleAlertVisible] = useToggle(false)
  const latestIsExporting = useLatest(isExporting)
  const hasExporting = useRef(false)
  const { getAllNotes } = noteStore
  const { getAllMetaObjects, getAllMetaLinks } = metaStore
  const { getAllDocuments } = createDocumentStore()
  const { getAllCollections } = useCollectionStore()
  const { getAllLabels } = useLabelStore()
  const handleImportData = async (file?: File) => {
    toggleIsImporting(true)
    try {
      const result = await importRendevozDb(file)
      toggleIsImporting(false)
      if (result) {
        toast.success('Successfully import data!')
        setTimeout(() => {
          getAllNotes()
          getAllMetaLinks()
          getAllMetaObjects()
          getAllCollections()
          getAllDocuments()
          getAllLabels()
        })
      } else {
        toast.error('Fail to import data! (Unaccepted data type)')
      }
    } catch (e) {
      console.error(e)
      toggleIsImporting(false)
      toast.error('Fail to import data! (Some errors happened)')
    }
  }
  const { renderUploader, upload } = useFileUpload(file => handleImportData(file))

  useEffect(() => {
    if (isExporting) {
      const hasex = hasExporting.current
      hasExporting.current = true
      !hasex &&
        exportRendevozDb()
          .then(data => {
            if (latestIsExporting.current) {
              const a = document.createElement('a')
              const blobUrl = URL.createObjectURL(data)
              a.href = blobUrl
              a.download = 'rendevoz_data.txt'
              a.click()
            }
          })
          .finally(() => {
            toggleIsExporting(false)
            hasExporting.current = false
          })
    }
  }, [isExporting])

  const items: SettingItem[] = [
    {
      title: 'Current Version',
      description: `Alpha ${APP_VERSION || 'Unknown'} (For test)`
    },
    {
      title: 'Export / Import Database Data',
      description: 'Pdfs and images can not be exported / imported.',
      column: true,
      children: (
        <>
          {renderUploader()}
          <Modal visible={alertVisible} onClose={toggleAlertVisible}>
            <Form
              onBack={toggleAlertVisible}
              onSubmit={() => {
                toggleAlertVisible(false)
                upload()
              }}
              title="Import Data Warning"
              submitText="understand"
              backText="cancel"
            >
              <div style={{ fontSize: 15, marginBottom: 24 }}>
                Imported data will <b>overwrite your current database file</b>, are you sure?
              </div>
            </Form>
          </Modal>
          <Content flex gap={20}>
            <Content
              flex
              centered
              gap={10}
              style={{ border: '1px solid rgba(31,34,39,0.06)', padding: '4px 24px' }}
              className={ClassName.flatButton()}
              onClick={toggleIsExporting}
            >
              {isExporting ? (
                <>
                  <Icon spin name="park-loading-four" />
                  Exporting {'(Click to cancel)'}
                </>
              ) : (
                <>
                  <Icon name="park-efferent-three" />
                  Export
                </>
              )}
            </Content>
            <Content
              flex
              gap={10}
              centered
              style={{ border: '1px solid rgba(31,34,39,0.06)', padding: '4px 24px' }}
              onClick={() => {
                toggleAlertVisible(true)
              }}
              className={ClassName.flatButton()}
            >
              {isImporting ? (
                <>
                  <Icon name="park-loading-four" spin />
                  Importing
                </>
              ) : (
                <>
                  <Icon name="park-afferent-three" />
                  Import
                </>
              )}
            </Content>
          </Content>
        </>
      )
    }
  ]

  return (
    <>
      {items.map(i => (
        <SettingItem {...i} />
      ))}
    </>
  )
}

export default GeneralSetting
