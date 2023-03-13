import { useToggle } from '@/hooks'
import useLatest from '@/hooks/utils/useLatest'
import createDocumentStore from '@/stores/document.store'
import { CollectionStore, LabelStore, MetaStore, NoteStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { exportRendevozDb, importRendevozDb } from '@/utils/db'
import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Content, Form, Icon } from '../base'
import Modal from '../base/Modal'
import useFileUpload from '../base/useFileUpload'
import SettingItem from './Item'
import { useTranslation } from 'react-i18next'
import { useSetting } from './Main'
import Select from '../base/select'
import { SelectOptionProps } from '../base/select/SelectOption'
import produce from 'immer'
import { useGlobalAtomValue } from '@/jotai/jotaiScope'
import { updateInfoAtom } from '@/Initializer'
import { ipcInstance } from '@/plugins'

const languageOptions: SelectOptionProps[] = [
  {
    value: 'zh-CN',
    children: '简体中文'
  },
  {
    value: 'en-US',
    children: 'English'
  }
]
const GeneralSetting = () => {
  const [isExporting, toggleIsExporting] = useToggle(false)
  const [isImporting, toggleIsImporting] = useToggle(false)
  const [alertVisible, toggleAlertVisible] = useToggle(false)
  const updateInfo = useGlobalAtomValue(updateInfoAtom)
  const latestIsExporting = useLatest(isExporting)
  const hasExporting = useRef(false)
  const { getAllNotes } = NoteStore
  const { getAllMetaObjects, getAllMetaLinks } = MetaStore
  const { getAllDocuments } = createDocumentStore()
  const { getAllCollections } = CollectionStore
  const { getAllLabels } = LabelStore
  const { t } = useTranslation()
  const [setting, setSetting] = useSetting()
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

  const checkCanUpdate = () => {
    if (APP_VERSION && updateInfo?.version) {
      if (Number(APP_VERSION) < Number(updateInfo.version)) {
        return true
      }
    }
    return false
  }
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
      title: t('settings.current version'),
      description: `Beta ${APP_VERSION || 'Unknown'}`
    },
    {
      title: t('settings.latest version'),
      description: `Beta ${updateInfo?.version || 'Unknown'} ${!checkCanUpdate() ? '(Latest)' : undefined}`,
      children: checkCanUpdate() && (
        <div
          onClick={() => {
            ipcInstance
              .send('updateAndInstall')
              .then(data => {
                toast.success('Successfully Downloaded!')
              })
              .catch(e => {
                toast.error('Failed to download.')
              })
          }}
          style={{
            border: '1px solid rgba(31, 34, 39, 0.06)'
          }}
          className={ClassName.flatButton()}
        >
          {t('settings.download and install')}
        </div>
      )
    },
    {
      title: t('settings.export/import data'),
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
                  {t('settings.export')}
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
                  {t('settings.import')}
                </>
              )}
            </Content>
          </Content>
        </>
      )
    },
    {
      title: t('settings.language'),
      description: t('settings.choose display language'),
      children: (
        <Select
          closeOnSelect
          options={languageOptions}
          value={setting.general.language}
          onSelect={v => {
            setSetting(
              produce(setting, draft => {
                draft.general.language = v[0] as typeof setting.general.language
              })
            )
          }}
        ></Select>
      )
    }
  ]

  return (
    <>
      {items.map((i, idx) => (
        <SettingItem key={idx} {...i} />
      ))}
    </>
  )
}

export default GeneralSetting
