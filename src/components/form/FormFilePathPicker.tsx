import ClassName from '@/styles/classNames'
import { Icon } from '../base'
import { groupClassName, hoverLabelClassName } from './useFlipForm'
import useFileUpload from '../base/useFileUpload'
import { useTranslation } from 'react-i18next'
import Colors from '@/consts/colors'
import { useSelectAtomValue, useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'

const FormFilePathPicker = ({
  onChange,
  filePath,
  maxWidth,
  accept
}: {
  onChange: (filePath: string | undefined, fileName: string | undefined, file: File | undefined) => void
  filePath: string
  maxWidth: number | string
  accept?: HTMLInputElement['accept']
}) => {
  const { renderUploader, upload, removeFile } = useFileUpload(file => {
    onChange(file.path, file.name, file)
  }, accept)
  const userFilePath = useSelectGlobalAtomValue(SettingAtom, s => s.general.userFilePath)
  const defaultFilePath = useSelectGlobalAtomValue(SettingAtom, s => s.general.defaultFilePath)
  const { t } = useTranslation()
  return (
    <div className={groupClassName}>
      <div className={hoverLabelClassName}>{t('general.file path')}</div>
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
      {renderUploader()}
      <div
        // className={ClassName.ellipsisFont(1)}
        style={{
          cursor: 'pointer',
          textTransform: filePath ? 'none' : undefined,
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
    </div>
  )
}

export default FormFilePathPicker
