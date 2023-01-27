import ClassName from '@/styles/classNames'
import { Icon } from '..'
import EmojiPicker from '../picker/emojiPicker'

const FormIconPicker = ({ onPick, onClose }: { onPick: (icon: string) => void; onClose: VoidFunction }) => {
  return (
    <div style={{ width: 550 }}>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginLeft: 8,
          marginRight: -4
        }}
        className={ClassName.description()}
      >
        Choose Collection Icon
        <Icon name="park-close" onClick={onClose} className={ClassName.circleButton()} />
      </div>
      <EmojiPicker width="100%" onPick={onPick} />
    </div>
  )
}

export default FormIconPicker
