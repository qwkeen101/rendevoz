import ClassName from '@/styles/classNames'
import { Content, Icon, Tooltip } from '../../base'
import { groupClassName, hoverLabelClassName } from '../useFlipForm'
import useFileUpload from '../../base/useFileUpload'
import { useTranslation } from 'react-i18next'
import Colors from '@/consts/colors'
import { useSelectGlobalAtomValue, useToggle } from '@/hooks'
import { SettingAtom } from '@/core'
import { useEffect, useRef, useState } from 'react'
import { Regexp } from '@/utils'
import { MetaFormLayoutItem } from '~/typings'
import Select from '@/components/base/select'
import { BaidudiskInstance } from '@/components/fileImporter/baidudisk/BaidudiskDisplayer'

const FormFilePathPicker = ({
  onChange,
  filePath,
  maxWidth,
  accept,
  enableWeb,
  enableBaidudisk,
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

  const [chooser, setChooser] = useState<'web' | 'local' | 'baidudisk'>('local')
  const [validUrl, setValidUrl] = useState(Regexp.isValidWebUrl(filePath))
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (filePath?.startsWith('http')) {
      setChooser('web')
    }
    if (filePath?.startsWith('baidudisk')) {
      setChooser('baidudisk')
    }
    if ((filePath?.includes('youtube') || filePath?.includes('bilibili')) && Regexp.isValidWebUrl(filePath)) {
      setValidUrl(true)
    }
  }, [filePath])
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
    <div className={groupClassName}>
      <div className={hoverLabelClassName}>{t('general.file path')}</div>
      {(enableWeb || enableBaidudisk) && (
        <Select
          align={"start"}
          padding={4}
          gap={6}
          onSelect={v => setChooser(v[0])}
          options={selectOptions}
          value={chooser}
          style={{ fontSize: 13, padding: '2px 4px', height: 24, width: 'fit-content', margin: '4px 0px 0px' }}
          menuStyle={{
            minWidth: 140
          }}
          closeOnSelect
        />
      )}
      <Icon
        name="park-close"
        className={ClassName.circleButton()}
        onClick={() => {
          onChange({ type: 'clear' })
          removeFile()
          if (inputRef.current) {
            inputRef.current.value = ''
            inputRef.current.focus()
          }
        }}
        containerStyle={{
          position: 'absolute',
          top: -10,
          right: 10,
          fontSize: 10
        }}
      />
      {chooser === 'web' && (
        <>
          <div>
            {!validUrl && (
              <Content flex gap={6} style={{ color: Colors.Common.Red, fontSize: '13px' }}>
                <Tooltip content="Only supports Youtube and Bilibili">
                  <Icon name={'park-info'} />
                </Tooltip>
                <span>Invalid URL</span>
              </Content>
            )}
            <input
              ref={inputRef}
              style={{
                outline: 'none',
                border: 'none',
                width: '100%',
                background: 'transparent'
              }}
              defaultValue={filePath}
              onChange={v => {
                const value = v.target.value
                if (Regexp.isValidWebUrl(value) && (value?.includes('youtube') || value?.includes('bilibili'))) {
                  setValidUrl(true)
                } else {
                  setValidUrl(false)
                }
              }}
              onBlur={e => {
                if (validUrl) {
                  onChange({
                    type: 'web',
                    url: e.target.value
                  })
                }
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
              color: filePath ? undefined : Colors.Font.Description,
              display: 'flex',
              gap: 10,
              alignItems: 'center'
            }}
            onClick={upload}
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
              color: filePath ? undefined : Colors.Font.Description,
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
  )
}

export default FormFilePathPicker
