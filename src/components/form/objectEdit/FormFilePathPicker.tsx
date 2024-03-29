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
        inputRef.current?.select()
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
        {/*<Icon*/}
        {/*  name="park-close"*/}
        {/*  className={ClassName.circleButton()}*/}
        {/*  onClick={() => {*/}
        {/*    onChange({ type: 'clear' })*/}
        {/*    removeFile()*/}
        {/*    if (inputRef.current) {*/}
        {/*      inputRef.current.value = ''*/}
        {/*      inputRef.current.focus()*/}
        {/*    }*/}
        {/*  }}*/}
        {/*  containerStyle={{*/}
        {/*    position: 'absolute',*/}
        {/*    top: -10,*/}
        {/*    right: 10,*/}
        {/*    fontSize: 10*/}
        {/*  }}*/}
        {/*/>*/}
        {chooser === 'web' && (
          <>
            <div>
              <input
                ref={inputRef}
                style={{
                  width: '100%',
                  background: 'transparent'
                }}
                onKeyDown={e => {
                  if (isHotkey(KEY.Enter, e)) {
                    onEnter?.()
                  }
                }}
                defaultValue={filePath}
                onChange={v => {
                  const value = v.target.value
                  deboucedChange.run({
                    type: 'web',
                    url: value
                  })
                  // if (Regexp.isValidWebUrl(value)) {
                  //   setValidUrl(true)
                  //
                  // } else {
                  //   setValidUrl(false)
                  // }
                }}
                placeholder={t('general.Input video url')}
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
