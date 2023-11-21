import useFileUpload from '../../base/useFileUpload'
import { Button } from '../../base'
import { GlobalImporterInstance } from '@/core/global/GlobalImporter'
import { useTranslation } from 'react-i18next'
import ClassName from '@/styles/classNames'

const FormNoteImporter = ({ onClose }: { onClose?: VoidFunction }) => {
  const { t } = useTranslation()
  const { renderUploader, upload } = useFileUpload(
    async file => {
      const files = Array.isArray(file) ? file : [file]
      GlobalImporterInstance.import?.(files)
      onClose?.()
    },
    '.md',
    {
      multiple: true
    }
  )

  return (
    <>
      {renderUploader()}
      <Button.IconButton
        text={t('general.import markdown')}
        className={ClassName.flatButton()}
        onClick={() => upload()}
        icon="park-afferent-three"
      ></Button.IconButton>
    </>
  )
}

export default FormNoteImporter
