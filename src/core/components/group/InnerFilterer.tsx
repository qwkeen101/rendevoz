import { MetaFilterGroup } from '~/typings'
import { Content } from '@/components'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { Colors } from '@/consts'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

const InnerFilterer = ({ filterGroup }: { filterGroup?: MetaFilterGroup }) => {
  const instance = useGroupInstance()
  return (
    <Content flex column style={{ marginTop: 12 }} className={'border br-6'}>
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
