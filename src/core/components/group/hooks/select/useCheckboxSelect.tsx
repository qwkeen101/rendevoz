import { Content, Icon } from '@/components'
import { useIsIn } from '@/hooks'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

const useCheckboxSelect = (selected: boolean, onChange: (selected: boolean) => void) => {
  const { isIn, ref } = useIsIn()
  const instance = useGroupInstance()
  const renderCheckbox = () => {
    return (
      <Content
        ref={ref}
        flex
        justifyContent={'center'}
        style={{
          opacity: isIn || selected ? 1 : 0,
          width: 32,
          transition: 'opacity 0.25s ease',
          flexShrink: 0,
          position: 'sticky',
          left: 0,
          zIndex: 20,
          cursor: 'pointer'
        }}
        onClick={e => {
          onChange(!selected)
          e.currentTarget.blur()
          instance.getOuterContainer?.()?.focus()
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <input
            style={{
              width: 14,
              height: 14,
              border: 'none',
              outline: 'none',
              pointerEvents: 'none'
            }}
            readOnly
            type={'checkbox'}
            checked={selected}
          />
        </div>
      </Content>
    )
  }
  return renderCheckbox
}

export default useCheckboxSelect
