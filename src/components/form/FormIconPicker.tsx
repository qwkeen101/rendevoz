import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import { Icon } from '..'
import EmojiPicker from '../picker/emojiPicker'

const FormIconPicker = ({ onPick, onClose }: { onPick: (icon: string) => void; onClose: VoidFunction }) => {
  const { t } = useTranslation()
  return (
    <div style={{ width: 550 }}>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginLeft: 8,
          marginRight: -4,
          textTransform: 'capitalize'
        }}
        className={ClassName.description()}
      >
        {`${t('general.choose')} ${t('general.icon')}`}
        <Icon name="park-close" onClick={onClose} className={ClassName.circleButton()} />
      </div>
      <EmojiPicker width="100%" onPick={onPick} />
    </div>
  )
}

export default FormIconPicker
