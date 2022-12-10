import { AnimatePopover, Content, Icon, WithBorder } from '@/components/base'
import useMetaStore from '@/stores/meta.store'
import { css } from '@emotion/css'
import { FC, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { RenderElementProps } from 'slate-react'
import { MetaKnowledgeObject } from '~/typings/data'
import { MetaObjectElement } from '../../types/outerElementTypes'
import MetaDetailsCard from './MetaDetailsCard'

const MetaObject: FC<RenderElementProps> = ({ children, element, attributes }) => {
  const metaEle = element as MetaObjectElement
  const [metaObject, setMetaObject] = useState<MetaKnowledgeObject>()
  const [detailsCardVisible, setDetailsCardVisible] = useState(false)
  const { getMetaObjectById } = useMetaStore()
  useEffect(() => {
    metaEle.originId && getMetaObjectById(metaEle.originId).then(obj => setMetaObject(obj))
  }, [element, getMetaObjectById])
  return (
    <span {...attributes} style={{ display: 'inline-flex' }}>
      <AnimatePopover
        positions={['bottom', 'top']}
        align="start"
        reposition
        visible={detailsCardVisible}
        containerStyle={{ zIndex: '10000' }}
        onClickOutside={() => setDetailsCardVisible(false)}
        boundaryInset={20}
        boundaryElement={document.body}
        content={
          <WithBorder>
            <MetaDetailsCard
              onNoteClick={() => setDetailsCardVisible(false)}
              onMetaGraphClick={() => setDetailsCardVisible(false)}
              onMetaDelete={() => setDetailsCardVisible(false)}
              obj={metaObject}
            />
          </WithBorder>
        }
      >
        <Content
          className={css({
            color: '#8590ae',
            margin: '0 1.1px',
            display: 'inline-flex !important',
            padding: '3px',
            cursor: 'pointer',
            gap: 7,
            border: '1px solid #8590ae',
            borderRadius: 4
          })}
          centered
          contentEditable={false}
          onClick={() => {
            if (metaObject === undefined) {
              toast.error('Meta object is missing')
            } else {
              setDetailsCardVisible(!detailsCardVisible)
            }
          }}
        >
          <span>
            <Icon name="park-share-one" />
          </span>
          {metaObject?.keyword}
        </Content>
      </AnimatePopover>
      {children}
    </span>
  )
}

export default MetaObject
