import { useToggle } from '@/hooks'
import useLatest from '@/hooks/utils/useLatest'
import { ClassName } from 'rendevoz'
import { exportRendevozDb, importRendevozDb } from '@/utils/db'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Content, Switch, Modal, Icon, ButtonChooser } from '@/components'
import useFileUpload from '../../components/base/useFileUpload'
import { ISettingItem } from './SettingItem'
import { useTranslation } from 'react-i18next'
import GlobalSetting from '.'
import Select from '@/components/base/select'
import { SelectOptionProps } from '../../components/base/select/SelectOption'
import produce from 'immer'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { updateInfoAtom } from '@/api/components/Initializer'
import { ipcInstance } from '@/electron'
import semver from 'semver'
import Colors from '@/consts/colors'
import BorderInput from '@/components/base/BorderInput'
import FontSize from '@/consts/font'
import { isValidHttpUrl } from '../components/webpage/utils'
import { changeFilePath, openDatabaseFolder } from '@/utils/file'
import SettingGroup from '@/core/setting/SettingGroup'
import { DateFormat } from '@/utils'
import { getAppState } from '@/core/rendevoz/appState'
import FileSystem from '@/api/fileSystem'
import { getOS } from '@/App'
import { initializeSearch } from '@/api/textSearch/SearchHelper'
import GlobalCSSEditor from '@/core/setting/GlobalCSSEditor'
const arrayRange = (start, stop, step) => Array.from({ length: (stop - start) / step + 1 }, (value, index) => start + index * step)

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
  const os = getOS()
  const [isExporting, toggleIsExporting] = useToggle(false)
  const [isImporting, toggleIsImporting] = useToggle(false)
  const updateInfo = useGlobalAtomValue(updateInfoAtom)
  const latestIsExporting = useLatest(isExporting)
  const hasExporting = useRef(false)
  const lastBackUp = getAppState().lastBackupDate
  const { t } = useTranslation()
  const [setting, setSetting] = GlobalSetting.useSetting()
  const [validCustomSearchEngine, setValidSearchEngine] = useState(false)
  const [cssVisible, setCssVisible] = useState(false)
  const handleImportData = async (file?: File) => {
    toggleIsImporting(true)
    try {
      const result = await importRendevozDb(file)
      toggleIsImporting(false)
      if (result) {
        toast.success('Successfully import data!')
        ipcInstance.send('reload')
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
  const Moon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill={'currentColor'}
        d="M23.4884 22.2366C23.6204 22.0993 23.4932 21.8783 23.3046 21.9057C22.8787 21.9675 22.4431 21.9995 22 21.9995C17.0294 21.9995 13 17.9701 13 12.9995C13 10.9978 13.6535 9.1486 14.7589 7.65382C14.8722 7.50063 14.7373 7.28425 14.554 7.33592C10.7721 8.40154 8 11.8768 8 15.9995C8 20.9701 12.0294 24.9995 17 24.9995C19.5492 24.9995 21.8509 23.9397 23.4884 22.2366Z"
      ></path>
    </svg>
  )

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

  const VersionItems: ISettingItem[] = [
    {
      title: t('settings.current version'),
      description: `${APP_VERSION || 'Unknown'}`
    },
    {
      title: t('settings.latest version'),
      description: `${updateInfo?.version || 'Unknown'} ${!checkCanUpdate() ? `(${t('settings.Latest')})` : ''}`,
      children: checkCanUpdate() && (
        <div
          onClick={() => {
            ipcInstance.send('downloadApp')
          }}
          className={ClassName.selectButton()}
        >
          {t('settings.Download update')}
        </div>
      )
    }
  ]

  const currentMode = setting.general.darkMode
  const followSystem = setting.general.followSystemTheme
  const ThemeItems: ISettingItem[] = [
    {
      column: true,
      children: (
        <Content flex gap={18}>
          <Content flex column alignItems={'center'} gap={4}>
            <Content
              flex
              alignItems={'center'}
              justifyContent={'center'}
              onClick={() => {
                setSetting(s => ({
                  ...s,
                  general: {
                    ...s.general,
                    darkMode: false,
                    followSystemTheme: false
                  }
                }))
              }}
              style={{
                width: 90,
                height: 60,
                background: 'white',
                borderRadius: 8,
                cursor: 'pointer',
                boxShadow: followSystem ? undefined : currentMode ? undefined : '0 0 0 2px var(--select-color)'
              }}
            >
              <Icon size={24} name={'park-sun'} containerStyle={{ color: 'black' }} />
            </Content>
            <div style={{ color: Colors.Font.Transparent, fontSize: 12 }}>Light</div>
          </Content>
          <Content flex column alignItems={'center'} gap={4}>
            <Content
              flex
              onClick={() => {
                setSetting(s => ({
                  ...s,
                  general: {
                    ...s.general,
                    darkMode: true,
                    followSystemTheme: false
                  }
                }))
              }}
              alignItems={'center'}
              justifyContent={'center'}
              style={{
                width: 90,
                height: 60,
                background: '#343333',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
                boxShadow: followSystem ? undefined : currentMode ? '0 0 0 2px var(--select-color)' : undefined
              }}
            >
              <Moon />
            </Content>
            <div style={{ color: Colors.Font.Transparent, fontSize: 12 }}>Dark</div>
          </Content>
          <Content flex column alignItems={'center'} gap={4}>
            <Content
              flex
              onClick={() => {
                setSetting(s => ({
                  ...s,
                  general: {
                    ...s.general,
                    followSystemTheme: !s.general.followSystemTheme
                  }
                }))
              }}
              alignItems={'center'}
              justifyContent={'center'}
              style={{
                width: 90,
                height: 60,
                background: 'linear-gradient(60deg, #dedede 10%, #198ccd 110%)',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
                boxShadow: followSystem ? '0 0 0 2px var(--select-color)' : undefined
              }}
            >
              <Icon size={24} name={'park-system'} theme={'filled'} />
            </Content>
            <div style={{ color: Colors.Font.Transparent, fontSize: 12 }}>System</div>
          </Content>
        </Content>
      )
    },
    {
      title: t('settings.Global stylesheet'),
      children: (
        <Button.IconButton
          text={t('general.edit')}
          onClick={() => {
            setCssVisible(true)
          }}
        />
      )
    }
  ]
  const LanguageItems: ISettingItem[] = [
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
    }
  ]
  const OthersItems: ISettingItem[] = [
    {
      title: t('settings.Enable notifications'),
      type: 'switch',
      value: setting.notification.enabled,
      onChange: v => setSetting(s => ({ ...s, notification: { ...s.notification, enabled: v } }))
    },
    {
      title: t('settings.Rebuild search index'),
      description: t('settings.Rebuild search desc'),
      children: (
        <Button.IconButton
          text={t('settings.Rebuild')}
          icon={'park-refresh'}
          onClick={() => {
            FileSystem.fs.deleteFile('rendefile:///meta-search-index.json').then(() => {
              initializeSearch()
            })
          }}
        />
      )
    },
    os === 'windows'
      ? {
          title: t('settings.Minimize to tray when close'),
          children: (
            <Switch
              value={setting.general.minimizeToTray}
              onChange={v =>
                setSetting(
                  produce(setting, draft => {
                    draft.general.minimizeToTray = !setting.general.minimizeToTray
                  })
                )
              }
            />
          )
        }
      : undefined,
    {
      title: t('settings.Auto save layout'),
      description: t('settings.Save layout desc'),
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
      title: 'Youtube API key',
      column: true,
      children: (
        <input
          style={{
            borderBottom: '1px solid var(--border-background)',
            width: '100%'
          }}
          spellCheck={'false'}
          placeholder={'Type your API key here...'}
          defaultValue={setting.general.youtubeApiKey}
          onBlur={e => {
            setSetting(s =>
              produce(s, draft => {
                draft.general.youtubeApiKey = e.target.value
              })
            )
          }}
          className={ClassName.noStyleInput}
        />
      )
    },
    setting.general.youtubeApiKey
      ? {
          title: 'Youtube max results',
          description: 'Max results you will get from a channel/playlist.',
          children: (
            <ButtonChooser
              value={setting.general.youtubeMaxItems ? String(setting.general.youtubeMaxItems) : '100'}
              onChange={v => {
                setSetting(s =>
                  produce(s, draft => {
                    draft.general.youtubeMaxItems = Number(v)
                  })
                )
              }}
              options={arrayRange(50, 1000, 50).map(i => i.toString())}
            />
          )
        }
      : undefined
  ].filter(i => i) as ISettingItem[]
  const FileItems: ISettingItem[] = [
    {
      title: t('settings.user file path'),
      description: t('settings.file path description'),
      column: true,
      children: (
        <Content fullWidth justifyContent="space-between" flex alignItems="center">
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
                FileSystem.fs.selectDir().then(path =>
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
      children: (
        <>
          {renderUploader()}
          <Content flex gap={8}>
            <Button.IconButton
              onClick={toggleIsExporting}
              spin={isExporting}
              text={t('settings.export')}
              icon={isExporting ? 'park-loading-four' : 'park-efferent-three'}
            />
            <Button.IconButton
              onClick={() => {
                upload()
              }}
              text={t('settings.import')}
              spin={isImporting}
              icon={isImporting ? 'park-loading-four' : 'park-afferent-three'}
            />
          </Content>
        </>
      )
    },
    {
      title: t('settings.data backup'),
      description: lastBackUp ? t('settings.last backup at') + ': ' + DateFormat.formatDistanceToNowStrict(lastBackUp, true) : undefined,
      children: (
        <Content flex gap={8}>
          <Select
            style={{
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
            text={t('settings.open backup folder')}
          />
        </Content>
      )
    },
    {
      title: t('settings.Auto recover from latest backup file'),
      children: (
        <Switch
          value={setting.general.autoRecoverFromBackup}
          onChange={v =>
            setSetting(s =>
              produce(s, draft => {
                draft.general.autoRecoverFromBackup = v
              })
            )
          }
        />
      )
    }
  ]
  console.log(lastBackUp)
  return (
    <>
      <Modal visible={cssVisible} onClose={() => setCssVisible(false)}>
        <GlobalCSSEditor />
      </Modal>
      <SettingGroup title={t('settings.Application details')} layout={VersionItems} />
      <SettingGroup title={t('settings.Theme')} layout={ThemeItems} />
      <SettingGroup title={t('settings.language')} layout={LanguageItems} />
      <SettingGroup title={t('settings.File and data')} layout={FileItems} />
      <SettingGroup title={t('settings.others')} layout={OthersItems} />
    </>
  )
}

export default GeneralSetting
