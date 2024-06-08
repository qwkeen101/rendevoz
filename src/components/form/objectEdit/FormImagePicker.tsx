import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import { Content, Icon, Image, Modal } from '../../base'
import useFileUpload from '../../base/useFileUpload'
import { useToggle } from '@/hooks'
import FormWebImagePicker from './FormWebImagePicker'
import FileSystem from '@/api/fileSystem'

const FormImagePicker = ({ imageUrl, onChange, name }: { imageUrl?: string; onChange?: (v: string | undefined) => void; name: string }) => {
  const { upload, renderUploader } = useFileUpload(file => {
    FileSystem.saveImage(file).then(data => {
      onChange?.(data)
    })
  }, 'image/*')
  const { t } = useTranslation()
  const [webImagePickerVisible, toggleWebImagePickerVisible] = useToggle(false)
  return (
    <>
      {renderUploader()}
      <Modal showClose visible={webImagePickerVisible} onClose={toggleWebImagePickerVisible}>
        <FormWebImagePicker
          name={name}
          onPick={url => {
            onChange?.(url)
            toggleWebImagePickerVisible(false)
          }}
        />
      </Modal>
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
        className={ClassName.flatButton(4, '4px 8px')}
      >
        <Content gap={10} flex style={{ textTransform: 'capitalize' }}>
          {imageUrl ? (
            <>
              <Icon size={16} name="park-delete-one" />
              <span>{`${t('general.delete')} ${t('general.image')}`}</span>
            </>
          ) : (
            <>
              <Icon size={16} name="park-add-pic" />
              <div>{t('general.upload image')}</div>
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
