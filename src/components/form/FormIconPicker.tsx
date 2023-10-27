import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import { Content, Icon } from '..'
import EmojiPicker from '../picker/emojiPicker'

const FormIconPicker = ({ onPick, onClose }: { onPick: (icon: string) => void; onClose: VoidFunction }) => {
  const { t } = useTranslation()
  return (
    <div style={{ width: 550 }}>
      <Content
        flex
        alignItems={'center'}
        style={{
          marginBottom: 6,
          display: 'flex',
          justifyContent: 'space-between',
          textTransform: 'capitalize',
          paddingLeft: 8,
          marginRight: -4
        }}
        className={ClassName.description()}
      >
        {`${t('general.choose')} ${t('general.icon')}`}
        <Icon name="park-close" onClick={onClose} className={ClassName.circleButton()} />
      </Content>
      <EmojiPicker width="100%" onPick={onPick} />
    </div>
  )
}

export default FormIconPicker
