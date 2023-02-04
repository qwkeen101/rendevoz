import ClassName from '@/styles/classNames'
import { Icon } from '..'
import ColorPicker from '../picker/colorPicker'

const FormColorPicker = ({
  onPick,
  onClose,
  disableLinear
}: {
  onPick: (e: string) => void
  onClose: VoidFunction
  disableLinear?: boolean
}) => {
  return (
    <div style={{ width: 400 }}>
      <div
        style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
        className={ClassName.description()}
      >
        Choose Collection Color
        <Icon name="park-close" onClick={onClose} className={ClassName.circleButton()} />
      </div>
      <ColorPicker disableLinear={disableLinear} onPick={onPick} />
    </div>
  )
}

export default FormColorPicker
