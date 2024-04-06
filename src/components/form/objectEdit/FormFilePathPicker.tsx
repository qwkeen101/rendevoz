import { Icon } from '../../base'
import { groupClassName, hoverLabelClassName } from '../useFlipForm'
import useFileUpload from '../../base/useFileUpload'
import { useTranslation } from 'react-i18next'
import { useDebounceFn, useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'
import { useEffect, useRef, useState } from 'react'
import { Regexp } from '@/utils'
import { MetaFormLayoutItem } from '~/typings'
import { BaidudiskInstance } from '@/components/fileImporter/baidudisk/BaidudiskDisplayer'
import ButtonSelect from '@/components/base/ButtonSelect'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'

const FormFilePathPicker = ({
  onChange,
  filePath,
  maxWidth,
  accept,
  enableWeb,
  enableBaidudisk,
  onEnter,
  baidudiskCategory
}: MetaFormLayoutItem & { type: 'filePathPicker' }) => {
  const { renderUploader, upload, removeFile } = useFileUpload(file => {
    onChange({
      type: 'local',
      filePath: file.path,
      file: file,
      fileName: file.name
    })
  }, accept)
  const userFilePath = useSelectGlobalAtomValue(SettingAtom, s => s.general.userFilePath)
  const defaultFilePath = useSelectGlobalAtomValue(SettingAtom, s => s.general.defaultFilePath)
  const { t, i18n } = useTranslation()
  const fileTypeCache = KeyvalueStore.useValue('filePickerType') || 'local'
  let defaultFileType = fileTypeCache
  if (!enableBaidudisk) {
    defaultFileType = defaultFileType === 'baidudisk' ? 'local' : defaultFileType
  }
  if (!enableWeb) {
    defaultFileType = defaultFileType === 'web' ? 'local' : defaultFileType
  }
  const [chooser, setChooser] = useState<'web' | 'local' | 'baidudisk'>(defaultFileType)
  const [validUrl, setValidUrl] = useState(Regexp.isValidWebUrl(filePath))
  const inputRef = useRef<HTMLInputElement>(null)
  const deboucedChange = useDebounceFn(
    v => {
      onChange?.(v)
    },
    { wait: 100 }
  )
  useEffect(() => {
    if (filePath?.startsWith('http')) {
      setChooser('web')
    }
    if (filePath?.startsWith('baidudisk')) {
      setChooser('baidudisk')
    }
    if (Regexp.isValidWebUrl(filePath)) {
      setValidUrl(true)
    }
  }, [filePath])

  useEffect(() => {
    if (chooser === 'web') {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select?.()
      })
    }
  }, [chooser])
  const selectOptions = [
    {
      value: 'local',
      children: t('general.Local file')
    }
  ]
  if (enableWeb) {
    selectOptions.push({
      value: 'web',
      children: t('general.Web file')
    })
  }
  if (enableBaidudisk && i18n.language === 'zh-CN') {
    selectOptions.push({
      value: 'baidudisk',
      children: t('general.Baidudisk file')
    })
  }
  return (
    <>
      {(enableWeb || enableBaidudisk) && (
        <ButtonSelect
          className={groupClassName}
          name={t('general.File type')}
          onSelect={v => {
            setChooser(v[0])
            KeyvalueStore.updateOne('filePickerType', v[0])
          }}
          options={selectOptions}
          value={chooser}
          style={{ padding: '6px 8px' }}
        />
      )}
      <div className={groupClassName} style={{ padding: '6px 8px' }}>
        <div className={hoverLabelClassName}>{t('general.file path')}</div>
        {chooser === 'web' && (
          <>
            <div>
              <AutosizeTextarea
                ref={inputRef}
                onKeyDown={e => {
                  if (e.currentTarget.innerText && isHotkey(KEY.Enter, e)) {
                    onEnter?.()
                  }
                }}
                autoFocus
                defaultValue={filePath}
                onChange={v => {
                  const value = v
                  deboucedChange.run({
                    type: 'web',
                    url: value
                  })
                }}
                placeholder={'Type URL...'}
              />
            </div>
          </>
        )}
        {chooser === 'local' && (
          <>
            {renderUploader()}
            <div
              style={{
                cursor: 'pointer',
                maxWidth,
                display: 'flex',
                gap: 10,
                alignItems: 'center'
              }}
              onClick={upload}
              className={'ellipsis-font-1'}
            >
              {filePath ? (
                filePath.replace('rendefile://', userFilePath || defaultFilePath || '')
              ) : (
                <>
                  <Icon name="park-file-addition-one" />
                  {t('general.choose one file')}
                </>
              )}
            </div>
          </>
        )}
        {chooser === 'baidudisk' && (
          <>
            <div
              style={{
                cursor: 'pointer',
                maxWidth,
                display: 'flex',
                gap: 10,
                alignItems: 'center'
              }}
              onClick={() => {
                BaidudiskInstance.chooseFile?.(1, true).then(res => {
                  if (res) {
                    onChange({ type: 'baidudisk', name: res.filename, url: res.path })
                  }
                })
              }}
            >
              {filePath ? (
                filePath.replace('baidudisk', '')
              ) : (
                <>
                  <Icon name="park-file-addition-one" />
                  {t('general.choose one file')}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default FormFilePathPicker
