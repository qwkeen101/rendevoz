import { Content, Icon } from '@/components/base'
import { Tag } from '@/components/form/EditMetaObjectForm'
import ClassName from '@/styles/classNames'
import { useMemo } from 'react'
import useEdges from '../../hooks/useEdges'
import useGraphNodes from '../../hooks/useGraphNodes'

const GraphOverview = () => {
  const [nodes] = useGraphNodes()
  const [links] = useEdges()
  const allTags = useMemo(() => {
    const set = new Set<string>()
    nodes?.forEach(i => i.tags?.forEach(tag => set.add(tag)))
    return Array.from(set)
  }, [nodes])
  const centerNode = useMemo(() => nodes?.find(i => i.isCenter), [nodes])
  return (
    <Content flex column style={{ fontFamily: 'Muli', width: 300 }}>
      <div className={ClassName.title('15px')}>Graph Info</div>
      <Content flex gap={10} className={ClassName.description()}>
        <div>Total Nodes:</div>
        <div style={{ color: 'black' }}>{nodes?.length || 0}</div>
      </Content>
      <Content flex gap={10} className={ClassName.description()}>
        <div>Total Links:</div>
        <div style={{ color: 'black' }}>{links?.length || 0}</div>
      </Content>
      <Content flex gap={10} className={ClassName.description()}>
        <div>Center Node:</div>
        <div style={{ color: 'black' }}>{centerNode?.label}</div>
      </Content>
      <div
        style={{
          margin: '12px 0px'
        }}
        className={ClassName.description('12px')}
      >
        TAGS
      </div>
      <Content flex gap={5} style={{ flexWrap: 'wrap' }}>
        {allTags.map(i => (
          <Tag tag={i} hideSize hideDelete small key={i} />
        ))}
      </Content>
    </Content>
  )
}

export default GraphOverview
