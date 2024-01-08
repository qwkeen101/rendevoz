import ClassName from '@/styles/classNames'
import { CSSProperties } from 'react'
import { Icon } from '../../index'
import { Content } from '../../base'
import MetaTagPicker from '@/core/object/MetaTagPicker'

const FormTagPicker = ({
  onClose,
  style,
  tags = [],
  onChange
}: {
  onClose?: VoidFunction
  style?: CSSProperties
  onChange?: (tags: number[]) => void
  tags?: number[]
}) => {
  return (
    <div style={{ width: 460, minHeight: 400, ...style }}>
      <Content
        flex
        justifyContent={'space-between'}
        alignItems={'center'}
        style={{
          marginBottom: 6,
          textTransform: 'capitalize',
          marginLeft: 10
        }}
        className={ClassName.description()}
      >
        <div>Manage tags</div>
        <Icon
          name="park-close"
          className={ClassName.circleButton()}
          onClick={() => {
            onClose?.()
          }}
        />
      </Content>
      <MetaTagPicker alreadyTags={tags} onChange={tags => onChange?.(tags)} />
    </div>
  )
}

export default FormTagPicker
