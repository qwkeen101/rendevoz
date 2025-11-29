import useSidebarDatabaseState from '@/components/layout/sidebar/useSidebarDatabaseState'
import ObjectList from '@/core/object/objectList/ObjectList'

export default ({ visible }: { visible: boolean }) => {
  const [data, setData] = useSidebarDatabaseState()
  return (
    <div className={'flex flex-col h-full w-full'}>
      <ObjectList visible={visible} filterSort={data} onFilterSortChange={setData} />
    </div>
  )
}
