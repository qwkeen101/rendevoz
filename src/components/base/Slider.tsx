import { css } from '@emotion/css'
import { default as RcSlider, SliderProps } from 'rc-slider'

const Slider = (props: SliderProps) => {
  return (
    <RcSlider
      {...props}
      className={css({
        '.rc-slider-handle': {
          border: 'solid 2px #8590ae',
          cursor: 'grabbing',
          opacity: 1,
          ':hover': {
            borderColor: '#8590ae'
          },
          ':active': {
            borderColor: '#8590ae !important',
            boxShadow: '0 0 10px #8590ae !important'
          }
        },
        '.rc-slider-track': {
          backgroundColor: '#8590ae'
        }
      })}
    ></RcSlider>
  )
}

export default Slider
