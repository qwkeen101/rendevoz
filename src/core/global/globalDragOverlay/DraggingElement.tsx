import { css } from '@emotion/css'

export const DraggingElement = ({ text }: { text: string }) => {
  return (
    <div
      className={css({
        boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px',
        padding: '20px 32px',
        width: 'fit-content',
        background: 'white',
        height: 'fit-content',
        fontFamily: 'Muli,serif',
        fontWeight: 700
      })}
    >
      {text || 'Drop to add object.'}
    </div>
  )
}
