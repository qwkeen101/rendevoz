import { Content, Icon } from '@/components'
import FileUploader from './FileUploader'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
export default ({ value, onDelete, onChange }: { value: string; onDelete?: VoidFunction; onChange?: (p: string) => void }) => {
  return (
    <Content>
      {value ? (
        <>
          <img src={value} width={'100%'} style={{ objectFit: 'cover', borderRadius: 6 }} />
          <Icon
            containerStyle={{
              position: 'absolute',
              top: 6,
              right: 6,
              color: Colors.Common.Red
            }}
            size={16}
            className={ClassName.circleButton()}
            name={'park-delete-one'}
            onClick={e => {
              e.stopPropagation()
              onDelete?.()
            }}
          />
        </>
      ) : (
        <FileUploader
          accept={'image/*'}
          onUpload={f => {
            onChange?.(f)
          }}
        />
      )}
    </Content>
  )
}
