import { Content, Icon } from '@/components'
import FileUploader from './FileUploader'
import { ClassName } from 'rendevoz'
import { Colors, Icons } from '@/consts'
import classnames from 'classnames'
export default ({ value, onDelete, onChange }: { value: string; onDelete?: VoidFunction; onChange?: (p: string) => void }) => {
  return (
    <Content>
      {value ? (
        <>
          <div className={'flex border-bottom justify-between items-center gap-3 p-1.5 pl-2'}>
            <div
              className={'cursor-pointer transparent-font break-all line-clamp-1 font-size-12'}
              onClick={() => {
                window.open(value)
              }}
            >
              {value}
            </div>
            <Icon
              size={16}
              className={'square-button-small'}
              name={Icons.Delete}
              onClick={e => {
                e.stopPropagation()
                onDelete?.()
              }}
            />
          </div>
          <img src={value} width={'100%'} style={{ objectFit: 'cover', maxHeight: 400 }} />
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
