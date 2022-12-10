import { isDocument, isNote } from '@/components/collection/utils'
import { useToggle } from '@/hooks'
import useCollectionStore from '@/stores/collection.store'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ICollection, INote, IPdfDocument } from '~/typings/data'
import Content from '../Content'
import Icon from '../Icon'

const SidebarCollection = () => {
  const { rootCollections } = useCollectionStore()

  return (
    <Content flex column style={{ marginBottom: 10 }}>
      {rootCollections.map(i => (
        <Item collection={i} />
      ))}
    </Content>
  )
}

const Item = ({ collection }: { collection: ICollection }) => {
  const { getChildrenItems, getChildrenCollections } = useCollectionStore()
  const [childrenItems, setChildrenItems] = useState<any[]>()
  const childrenCollections = getChildrenCollections(collection.id)
  const childrenNotes = childrenItems?.filter(i => isNote(i)) as INote[]
  const childrenDocuments = childrenItems?.filter(i => isDocument(i)) as IPdfDocument[]
  const [hideChildren, toggleHideChildren] = useToggle(true)
  const navigate = useNavigate()
  useEffect(() => {
    getChildrenItems(collection.id).then(items => {
      setChildrenItems(items.filter(i => !!i))
    })
  }, [])
  return (
    <Content
      flex
      column
      className={css({
        color: '#5f6065',
        userSelect: 'none'
      })}
    >
      <Content
        flex
        onClick={toggleHideChildren}
        alignItems="center"
        className={css({
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderRadius: 4,
          padding: 2,
          paddingLeft: 14,
          ':hover': {
            background: 'rgba(0,0,0,0.07)'
          }
        })}
      >
        <Icon
          className={css({
            transform: hideChildren ? 'rotate(90deg)' : undefined,
            transition: 'all 0.2s ease',
            transformOrigin: 'center',
            position: 'absolute',
            left: -14
          })}
          size={12}
          theme="filled"
          name="park-right-one"
        />
        <Content flex gap={10}>
          <Icon name="park-folder-close" />
          <div
            className={css({
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            })}
          >
            {collection.name}
          </div>
        </Content>
      </Content>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: hideChildren ? 0 : 1,
          height: hideChildren ? 0 : 'auto'
        }}
        className={css({
          paddingLeft: 15,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        })}
      >
        {childrenCollections?.map(i => (
          <Item collection={i} />
        ))}
        {childrenDocuments?.map(i => (
          <Content
            flex
            gap={10}
            onClick={() => navigate(`/pdf/${i.id}`)}
            className={css({
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderRadius: 4,
              padding: 2,
              paddingLeft: 14,
              ':hover': {
                background: 'rgba(0,0,0,0.07)'
              }
            })}
          >
            <Icon name="park-file-pdf" />
            <div
              className={css({
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              })}
            >
              {i.name}
            </div>
          </Content>
        ))}
        {childrenNotes?.map(i => (
          <Content
            flex
            gap={10}
            onClick={() => navigate(`/editor/${i.id}`)}
            className={css({
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderRadius: 4,
              padding: 2,
              paddingLeft: 14,
              ':hover': {
                background: 'rgba(0,0,0,0.07)'
              }
            })}
          >
            <Icon name="park-notes" />
            <div
              className={css({
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              })}
            >
              {i.title}
            </div>
          </Content>
        ))}
      </motion.div>
    </Content>
  )
}
export default SidebarCollection
