import { useToggle } from '@/hooks'
import useLatest from '@/hooks/utils/useLatest'
import { CollectionStore, MetaStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { exportRendevozDb, importRendevozDb } from '@/utils/db'
import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Content, Form, Icon, Switch } from '../../components/base'
import Modal from '../../components/base/Modal'
import useFileUpload from '../../components/base/useFileUpload'
import SettingItem from './Item'
import { useTranslation } from 'react-i18next'
import { useSetting } from '.'
import Select from '../../components/base/select'
import { SelectOptionProps } from '../../components/base/select/SelectOption'
import produce from 'immer'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { updateInfoAtom } from '@/Initializer'
import { ipcInstance } from '@/plugins'
import semver from 'semver'
import { t } from 'i18next'

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
  const { getAllMetaObjects, getAllMetaLinks } = MetaStore
  const { getAllCollections } = CollectionStore
  const { t } = useTranslation()
  const [setting, setSetting] = useSetting()
  const newTabOptions: SelectOptionProps[] = [
    {
      value: 'always open new tab',
      children: t('settings.always open new tab')
    },
    {
      value: 'open existing tab',
      children: t('settings.open existing tab')
    }
  ]
  const handleImportData = async (file?: File) => {
    toggleIsImporting(true)
    try {
      const result = await importRendevozDb(file)
      toggleIsImporting(false)
      if (result) {
        toast.success('Successfully import data!')
        setTimeout(() => {
          getAllMetaLinks()
          getAllMetaObjects()
          getAllCollections()
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
      if (semver.gt(updateInfo.version, APP_VERSION)) {
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
      description: `Beta ${updateInfo?.version || 'Unknown'} ${!checkCanUpdate() ? '(Latest)' : ''}`,
      children: checkCanUpdate() && (
        <div
          onClick={() => {
            toast.success('Begin Download Update, Update will be installed after quit.')
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
      title: t('settings.dark mode'),
      children: (
        <Switch
          value={setting.general.darkMode}
          onChange={v =>
            setSetting(
              produce(setting, draft => {
                draft.general.darkMode = !setting.general.darkMode
              })
            )
          }
        />
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
    },
    {
      title: t('settings.open new tab'),
      description: t('settings.choose open new tab action'),
      children: (
        <Select
          closeOnSelect
          options={newTabOptions}
          value={setting.general.openNewTab}
          onSelect={v => {
            setSetting(
              produce(setting, draft => {
                draft.general.openNewTab = v[0] as typeof setting.general.openNewTab
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
