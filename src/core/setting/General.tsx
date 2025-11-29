import { useToggle } from '@/hooks'
import useLatest from '@/hooks/utils/useLatest'
import { ClassName } from 'rendevoz'
import { exportRendevozDb, importRendevozDb } from '@/utils/db'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Button, Content, Select, Switch, Modal, Icon, AnimatePopover, WithBorder } from '@/components'
import useFileUpload from '../../components/base/useFileUpload'
import { ISettingItem } from './SettingItem'
import { useTranslation } from 'react-i18next'
import GlobalSetting from '.'
import { SelectOptionProps } from '../../components/base/select/SelectOption'
import produce from 'immer'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { updateInfoAtom } from '@/api/components/Initializer'
import { ipcInstance } from '@/electron'
import semver from 'semver'
import Colors from '@/consts/colors'
import { changeFilePath, openDatabaseFolder } from '@/utils/file'
import SettingGroup from '@/core/setting/SettingGroup'
import { DateFormat } from '@/utils'
import FileSystem from '@/api/fileSystem'
import { getOS } from '@/App'
import { initializeSearch } from '@/api/textSearch/SearchHelper'
import GlobalCSSEditor from '@/core/setting/GlobalCSSEditor'
import langCodes from '@/assets/languageCodes.json'
import trans from '@/consts/trans'
import useImportFont from '@/core/setting/useImportFont'
import { Icons } from '@/consts'

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
  const lastBackUp = Global.appState.getState().lastBackupDate
  const { t } = useTranslation()
  const [setting, setSetting] = GlobalSetting.useSetting()
  const [cssVisible, setCssVisible] = useState(false)
  const { item: importFont, renderFontManager } = useImportFont()
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
          text={t(trans.Edit)}
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
    },
    {
      type: 'select',
      title: t('settings.Target language for translation'),
      options: langCodes.map(i => ({
        children: i.language,
        value: i.tag
      })),
      value: setting.general.translateTargetLanguage,
      onChange: v => {
        setSetting(s => ({ ...s, general: { ...s.general, translateTargetLanguage: v } }))
      }
    }
  ]
  const OthersItems: ISettingItem[] = [
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
      title: 'Youtube API key',
      focusKey: 'youtubeApiKey',
      type: 'input',
      value: setting.general.youtubeApiKey,
      onChange: v =>
        setSetting(s => ({
          ...s,
          general: { ...s.general, youtubeApiKey: v }
        }))
    }
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
              icon={Icons.Folder}
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
      description: lastBackUp ? t('settings.last backup at') + ': ' + DateFormat.formatTime(lastBackUp) : undefined,
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
            icon={Icons.Folder}
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
  return (
    <>
      {renderFontManager()}
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
