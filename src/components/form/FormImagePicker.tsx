import ClassName from '@/styles/classNames'
import { saveImageLocally } from '@/utils/img'
import { useTranslation } from 'react-i18next'
import { Content, Icon, Image } from '../base'
import useFileUpload from '../base/useFileUpload'

const FormImagePicker = ({ imageUrl, onChange }: { imageUrl?: string; onChange?: (v: string | undefined) => void }) => {
  const { upload, renderUploader } = useFileUpload(file => {
    saveImageLocally(file.name, file).then(data => {
      onChange?.(data.data)
    })
  }, 'image/*')
  const { t } = useTranslation()
  return (
    <>
      {renderUploader()}
      <Content
        alignItems="center"
        justifyContent="space-between"
        flex
        gap={8}
        onClick={() => {
          if (imageUrl) {
            onChange?.(undefined)
          } else {
            upload()
          }
        }}
        className={ClassName.flatButton()}
      >
        <Content gap={8} flex style={{ textTransform: 'capitalize' }}>
          {imageUrl ? (
            <>
              <Icon name="park-delete" />
              <span>{`${t('general.delete')} ${t('general.image')}`}</span>
            </>
          ) : (
            <>
              <Icon name="park-add-pic" />
              <span>{`${t('general.add')} ${t('general.image')}`}</span>
            </>
          )}
        </Content>
        {imageUrl && (
          <Content
            flex
            centered
            style={{
              width: 20,
              height: 20,
              flexShrink: 0
            }}
          >
            <Image src={imageUrl} style={{ borderRadius: 6 }} width="100%" />
          </Content>
        )}
      </Content>
    </>
  )
}

export default FormImagePicker
