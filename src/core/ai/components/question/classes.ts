import { css } from '@emotion/css'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'

export const SelectOptionClass = css([
  ClassName.flatButton(),
  {
    border: `1px solid ${Colors.Background.Border}`,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    padding: '5px 12px',
    fontSize: 14,
    fontWeight: 500
  },
  {
    svg: {
      opacity: 0,
      transition: 'opacity 0.25s ease'
    },
    ':hover': {
      svg: {
        opacity: 1
      }
    }
  }
])
