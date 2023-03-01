import { Content } from '@/components/base'
import createMetaStore from '@/stores/meta.store'
import { useState, useEffect } from 'react'
import { MetaKnowledgeObject, MetaComment } from '~/typings/data'
import MetaCommentItem from './MetaCommentItem'

const MetaCommentContainer = ({ obj }: { obj?: MetaKnowledgeObject }) => {
  const { getMetaCommentsByIds } = createMetaStore()
  const [comments, setComments] = useState<MetaComment[]>([])
  useEffect(() => {
    getMetaCommentsByIds(obj?.commentIds || []).then(data => {
      setComments(data.filter(i => !!i))
    })
  }, [obj])
  return (
    <Content flex column style={{ marginLeft: '-6px' }}>
      {comments?.map(i => (
        <MetaCommentItem key={i.id} obj={obj} comment={i} />
      ))}
      <MetaCommentItem obj={obj} comment={undefined} />
    </Content>
  )
}
export default MetaCommentContainer
