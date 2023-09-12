import { useToggle } from '@/hooks'
import useLatest from '@/hooks/utils/useLatest'
import { CollectionStore, MetaStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { exportRendevozDb, importRendevozDb } from '@/utils/db'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Content, Form, Switch } from '../../components/base'
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
import Colors from '@/consts/colors'
import BorderInput from '@/components/base/BorderInput'
import FontSize from '@/consts/font'
import { isValidHttpUrl } from '../webpage/utils'
import { changeFilePath, getSelectedFolderPath, openDatabaseFolder } from '@/utils/file'

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
  const [validCustomSearchEngine, setValidSearchEngine] = useState(false)
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
  const { renderUploader, upload } = useFileUpload(file => handleImportData(file), 'application/JSON')

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
              a.download = 'rendevoz_data.json'
              a.click()
            }
          })
          .finally(() => {
            toggleIsExporting(false)
            hasExporting.current = false
          })
    }
  }, [isExporting])

  useEffect(() => {
    if (setting.general.customSearchEngineUrl) {
      const v = setting.general.customSearchEngineUrl
      if ((v.startsWith('http://') || v.startsWith('https://')) && v.includes('{query}') && isValidHttpUrl(v)) {
        setValidSearchEngine(true)
      } else {
        setValidSearchEngine(false)
      }
    } else {
      setValidSearchEngine(false)
    }
  }, [setting.general.customSearchEngineUrl])

  const items: (SettingItem | undefined)[] = [
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
      title: t('settings.user file path'),
      description: t('settings.file path description'),
      column: true,
      children: (
        <Content style={{ marginTop: -6 }} fullWidth justifyContent="space-between" flex alignItems="center">
          <div style={{ flex: 1 }} className={ClassName.ellipsisFont(1)}>
            {setting.general.userFilePath || 'Default User Path'}
          </div>
          <Content flex gap={10}>
            {setting.general.userFilePath !== setting.general.defaultFilePath && (
              <Button.IconButton
                onClick={() =>
                  setSetting(
                    produce(setting, s => {
                      s.general.userFilePath = s.general.defaultFilePath
                      s.general.defaultFilePath && changeFilePath(s.general.defaultFilePath)
                    })
                  )
                }
                icon="park-redo"
                text={t('settings.reset as default folder')}
              />
            )}
            <Button.IconButton
              onClick={() =>
                getSelectedFolderPath().then(path =>
                  setSetting(
                    produce(setting, s => {
                      s.general.userFilePath = path
                      changeFilePath(path)
                    })
                  )
                )
              }
              icon="park-folder-close"
              text={t('settings.choose folder')}
            />
          </Content>
        </Content>
      )
    },
    {
      title: t('settings.auto copy file when import'),
      description: t('settings.copy file desc'),
      children: (
        <Switch
          value={setting.general.copyFileWhenImport}
          onChange={v =>
            setSetting(s =>
              produce(s, draft => {
                draft.general.copyFileWhenImport = v
              })
            )
          }
        />
      )
    },
    {
      title: t('settings.export/import data'),
      description: t('settings.export description'),
      column: true,
      children: (
        <>
          {renderUploader()}
          <Modal showClose noStyle visible={alertVisible} onClose={toggleAlertVisible}>
            <div style={{ padding: '16px', borderRadius: 10 }} className={ClassName.Background.pseudoBlubBackground}>
              <Form
                onBack={toggleAlertVisible}
                onSubmit={() => {
                  toggleAlertVisible(false)
                  upload()
                }}
                title={t('general.warning')}
                submitText="understand"
                backText="cancel"
              >
                <div style={{ margin: '10px 0px 16px', textTransform: 'none' }}>{t('settings.import data warning')}</div>
              </Form>
            </div>
          </Modal>
          <Content flex gap={20}>
            <Button.IconButton
              style={{
                border: `1px solid ${Colors.Background.Border}`,
                padding: '4px 24px'
              }}
              onClick={toggleIsExporting}
              spin={isExporting}
              text={t('settings.export')}
              icon={isExporting ? 'park-loading-four' : 'park-efferent-three'}
            />
            <Button.IconButton
              style={{
                border: `1px solid ${Colors.Background.Border}`,
                padding: '4px 24px'
              }}
              onClick={() => {
                toggleAlertVisible(true)
              }}
              text={t('settings.import')}
              spin={isImporting}
              icon={isImporting ? 'park-loading-four' : 'park-afferent-three'}
            />
            <Select
              style={{
                border: `1px solid ${Colors.Background.Border}`,
                padding: '4px 24px',
                height: 'auto'
              }}
              closeOnSelect
              value={setting.general.autoBackup}
              placeholder={t('settings.autoBackup')}
              onSelect={v => {
                const value = v[0] as string
                setSetting(s =>
                  produce(s, d => {
                    d.general.autoBackup = value
                  })
                )
              }}
              options={[
                {
                  value: 'never',
                  children: t('settings.never')
                },
                {
                  value: 'whenClose',
                  children: t('settings.whenClose')
                },
                {
                  value: 'every day',
                  children: t('settings.every day')
                },
                {
                  value: 'every week',
                  children: t('settings.every week')
                },
                {
                  value: 'every month',
                  children: t('settings.every month')
                }
              ]}
            ></Select>
            <Button.IconButton
              onClick={() => {
                openDatabaseFolder()
              }}
              icon="park-folder-open"
              text={t('settings.open database folder')}
              style={{
                border: `1px solid ${Colors.Background.Border}`,
                padding: '4px 24px'
              }}
            />
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
      title: t('settings.auto save layout'),
      children: (
        <Switch
          value={setting.general.autoSaveLayout}
          onChange={v =>
            setSetting(
              produce(setting, draft => {
                draft.general.autoSaveLayout = !setting.general.autoSaveLayout
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
          value={setting.general.language || setting.general.defaultLanguage}
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
    },
    {
      title: t('settings.default search engine'),
      children: (
        <Select
          closeOnSelect
          value={setting.general.defaultSearchEngine}
          menuStyle={{
            maxHeight: 200,
            overflowY: 'auto'
          }}
          onSelect={v => {
            setSetting(
              produce(setting, draft => {
                draft.general.defaultSearchEngine = v[0]
              })
            )
          }}
          options={[
            {
              value: 'custom',
              children: t('settings.custom')
            },
            {
              value: 'google',
              children: t('settings.google')
            },
            {
              value: 'google scholar',
              children: t('settings.google scholar')
            },
            {
              value: 'semantic scholar',
              children: t('settings.semantic scholar')
            },
            {
              value: 'wikipedia',
              children: t('settings.wikipedia')
            },
            // {
            //   value: 'wiki summary',
            //   children: t('settings.wiki summary')
            // },
            {
              value: 'vocabulary',
              children: t('settings.vocabulary')
            },
            {
              value: 'bing',
              children: t('settings.bing')
            },
            ...(setting.general.language === 'zh-CN'
              ? [
                  {
                    value: 'baidu',
                    children: t('settings.baidu')
                  },
                  {
                    value: 'zhihu',
                    children: t('settings.zhihu')
                  },
                  {
                    value: 'bing dictionary',
                    children: t('settings.bing dictionary')
                  },
                  {
                    value: 'youdao dictionary',
                    children: t('settings.youdao dictionary')
                  }
                ]
              : [])
          ]}
        ></Select>
      )
    },
    setting.general.defaultSearchEngine === 'custom'
      ? {
          title: t('settings.customize search engine'),
          column: true,
          children: (
            <Content flex fullWidth column gap={5}>
              <div style={{ textTransform: 'none' }} className={ClassName.description(FontSize['12px'])}>
                {t('settings.search engine example')}
              </div>
              <div
                style={{
                  color: validCustomSearchEngine ? 'green' : 'red',
                  marginBottom: 4
                }}
              >
                {validCustomSearchEngine ? t('settings.valid url') : t('settings.invalid url')}
              </div>
              <BorderInput
                textarea={false}
                placeholder={t('settings.input url')}
                style={{ padding: '4px 12px' }}
                containerStyle={{ width: '100%' }}
                value={setting.general.customSearchEngineUrl}
                onChange={v => {
                  if (typeof v === 'string') {
                    setSetting(
                      produce(setting, s => {
                        s.general.customSearchEngineUrl = v
                      })
                    )
                  }
                }}
              ></BorderInput>
            </Content>
          )
        }
      : undefined,
    {
      title: t('settings.default image search engine'),
      children: (
        <Select
          closeOnSelect
          value={setting.general.defaultImageSearchEngine}
          menuStyle={{
            maxHeight: 200,
            overflowY: 'auto'
          }}
          onSelect={v => {
            setSetting(
              produce(setting, draft => {
                draft.general.defaultImageSearchEngine = v[0]
              })
            )
          }}
          options={[
            {
              value: 'google',
              children: t('settings.google')
            },
            {
              value: 'bing',
              children: t('settings.bing')
            },
            {
              value: 'pinterest',
              children: t('settings.pinterest')
            },
            setting.general.language === 'zh-CN' && {
              value: 'baidu',
              children: t('settings.baidu')
            }
          ]}
        ></Select>
      )
    }
  ]

  return <>{items.map((i, idx) => i && <SettingItem key={idx} {...i} />)}</>
}

export default GeneralSetting
