import Colors from '@/consts/colors'
import { css } from '@emotion/css'

export const DraggingElement = ({ text }: { text: string }) => {
  return (
    <div
      className={css({
        boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px',
        padding: '20px 32px',
        width: 'fit-content',
        background: Colors.Background.Global,
        height: 'fit-content',
        fontWeight: 700,
        color: Colors.Font.Primary
      })}
    >
      {text || 'Drop to add object.'}
    </div>
  )
}
