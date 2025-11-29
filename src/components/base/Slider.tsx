import Colors from '@/consts/colors'
import { css } from '@emotion/css'
import classNames from 'classnames'
import { default as RcSlider, SliderProps } from 'rc-slider'
import 'rc-slider/assets/index.css'

const Slider = (props: SliderProps & { disableOriginalClass?: boolean }) => {
  return (
    <RcSlider
      {...props}
      className={classNames(
        css(
          props.disableOriginalClass
            ? undefined
            : {
                '.rc-slider-handle': {
                  border: 'none !important',
                  cursor: 'grabbing',
                  backgroundColor: 'var(--font-primary-solid)',
                  opacity: 1,
                  ':hover': {
                    borderColor: 'transparent'
                  },
                  ':active': {
                    borderColor: 'transparent !important',
                    boxShadow: 'none !important'
                  }
                },
                '.rc-slider-track': {
                  height: 5,
                  backgroundColor: Colors.Font.Transparent
                },
                '.rc-slider-rail': {
                  height: 5,
                  backgroundColor: Colors.Background.ButtonHover
                }
              }
        ),
        props.className
      )}
    ></RcSlider>
  )
}

export default Slider
