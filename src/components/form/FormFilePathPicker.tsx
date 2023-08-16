import ClassName from '@/styles/classNames'
import { Content, Icon, Tooltip } from '../base'
import { groupClassName, hoverLabelClassName } from './useFlipForm'
import useFileUpload from '../base/useFileUpload'
import { useTranslation } from 'react-i18next'
import Colors from '@/consts/colors'
import { useSelectGlobalAtomValue, useToggle } from '@/hooks'
import { SettingAtom } from '@/core'
import { useEffect, useState } from 'react'
import { Regexp } from '@/utils'

const FormFilePathPicker = ({
  onChange,
  filePath,
  maxWidth,
  accept,
  enableWeb
}: {
  onChange: (filePath: string | undefined, fileName: string | undefined, file: File | undefined) => void
  filePath: string
  maxWidth: number | string
  accept?: HTMLInputElement['accept']
  enableWeb?: boolean
}) => {
  const { renderUploader, upload, removeFile } = useFileUpload(file => {
    onChange(file.path, file.name, file)
  }, accept)
  const userFilePath = useSelectGlobalAtomValue(SettingAtom, s => s.general.userFilePath)
  const defaultFilePath = useSelectGlobalAtomValue(SettingAtom, s => s.general.defaultFilePath)
  const { t } = useTranslation()
  const [isWebChooser, toggleIsWebChoose] = useToggle(enableWeb)
  const [validUrl, setValidUrl] = useState(Regexp.isValidWebUrl(filePath))
  useEffect(() => {
    if (filePath?.startsWith('http')) {
      toggleIsWebChoose(true)
    }
    if ((filePath?.includes('youtube') || filePath?.includes('bilibili')) && Regexp.isValidWebUrl(filePath)) {
      setValidUrl(true)
    }
  }, [filePath])

  return (
    <div className={groupClassName}>
      <div className={hoverLabelClassName}>{isWebChooser ? t('general.Video URL') : t('general.file path')}</div>
      {enableWeb && (
        <Icon
          onClick={toggleIsWebChoose}
          className={ClassName.circleButton()}
          name={isWebChooser ? 'park-file-addition' : 'park-add-web'}
          containerStyle={{
            position: 'absolute',
            top: -10,
            right: 32,
            fontSize: 10
          }}
        />
      )}
      <Icon
        name="park-close"
        className={ClassName.circleButton()}
        onClick={() => {
          onChange(undefined, undefined, undefined)
          removeFile()
        }}
        containerStyle={{
          position: 'absolute',
          top: -10,
          right: 10,
          fontSize: 10
        }}
      />
      {isWebChooser ? (
        <>
          <div>
            {!validUrl && (
              <Content flex gap={6} style={{ color: Colors.Common.Red, fontSize: '11px' }}>
                <Tooltip content="Only supports Youtube and Bilibili">
                  <Icon name={'park-info'} />
                </Tooltip>
                <span>Invalid URL</span>
              </Content>
            )}
            <input
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
                  onChange(e.currentTarget.value, e.currentTarget.value, undefined)
                }
              }}
              placeholder={t('general.Input video url')}
            />
          </div>
        </>
      ) : (
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
    </div>
  )
}

export default FormFilePathPicker
