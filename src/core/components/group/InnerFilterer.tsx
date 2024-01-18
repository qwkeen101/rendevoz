import { MetaFilterGroup } from '~/typings'
import { Content } from '@/components'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { Colors } from '@/consts'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

const InnerFilterer = ({ filterGroup }: { filterGroup?: MetaFilterGroup }) => {
  const instance = useGroupInstance()
  return (
    <Content
      flex
      column
      style={{
        border: `1px solid ${Colors.Background.Border}`,
        padding: '16px 12px',
        borderRadius: 8,
        margin: '6px 0px'
      }}
    >
      {filterGroup && (
        <BetterFilter
          root={filterGroup}
          showHiddenMetas={true}
          onChange={r => {
            console.log(r)
            if (r !== filterGroup) {
              instance.updateGroupData?.(w => ({ ...w, rootFilterGroup: r }))
            }
          }}
        />
      )}
    </Content>
  )
}

export default InnerFilterer
