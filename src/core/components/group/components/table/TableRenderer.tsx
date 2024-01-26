import { forwardRef, memo, ReactElement } from 'react'
import { MetaGroupChild } from '~/typings'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { Content } from '@/components'
import GroupTableHeader from '@/core/components/group/components/table/headers/TableHeader'
import TableBodyRenderer from '@/core/components/group/components/table/TableWrapper'

export default memo(
  forwardRef(
    (
      {
        value,
        enableVirtualizer = true,
        extraHeaderNode,
        bodyVisible = true,
        grouperId,
        showAddMore,
        ...rest
      }: {
        value?: MetaGroupChild[]
        enableVirtualizer?: boolean
        bodyVisible?: boolean
        showAddMore?: boolean
        grouperId?: number
        extraHeaderNode?: ReactElement
      },
      ref
    ) => {
      const currentViewId = useSelectAtomValue(GroupStateAtom, s => s.currentView?.id)
      return (
        <Content
          ref={ref}
          {...rest}
          flex
          column
          style={{ height: enableVirtualizer ? 0 : 'auto', flex: 1, padding: '0px 60px', width: '100%' }}
        >
          <Content style={{ width: '100%', height: 'auto', marginBottom: bodyVisible ? 68 : undefined }}>
            <GroupTableHeader visible={bodyVisible} grouperId={grouperId} extraNode={extraHeaderNode} key={currentViewId} />
            {bodyVisible && (
              <TableBodyRenderer showAddMore={showAddMore} grouperId={grouperId} enableVirtualizer={enableVirtualizer} value={value} />
            )}
          </Content>
        </Content>
      )
    }
  )
)
