import { IGroupInstance } from '~/typings'
import { Content, Icon } from '@/components'
import { Colors } from '@/consts'
import { useRef } from 'react'
import { useIsIn } from '@/hooks'

const useCheckboxSelect = (selected: boolean, onChange: (selected: boolean) => void) => {
  const { isIn, ref } = useIsIn()
  const renderCheckbox = () => {
    return (
      <Content
        ref={ref}
        flex
        alignItems={'center'}
        style={{
          opacity: isIn || selected ? 1 : 0,
          width: 32,
          height: 32,
          transition: 'opacity 0.25s ease'
        }}
      >
        <input
          style={{
            width: 14,
            height: 14,
            border: 'none',
            outline: 'none'
          }}
          onChange={() => onChange(!selected)}
          type={'checkbox'}
          checked={selected}
        />
      </Content>
    )
  }
  return renderCheckbox
}

export default useCheckboxSelect
