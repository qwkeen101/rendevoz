import { AnimatePopover, Content, Icon, Image, WithBorder } from '@/components/base'
import useEventEmitter from '@/events/useEventEmitter'
import useMetaStore from '@/stores/meta.store'
import { css } from '@emotion/css'
import { FC, useEffect, useRef, useState } from 'react'
import { RenderElementProps } from 'slate-react'
import { MetaKnowledgeObject } from '~/typings/data'
import { MetaObjectElement } from '../../types/outerElementTypes'
import MetaDetailsCard from './MetaDetailsCard'

const MetaObject: FC<RenderElementProps> = ({ children, element, attributes }) => {
  const metaEle = element as MetaObjectElement
  const [metaObject, setMetaObject] = useState<MetaKnowledgeObject>()
  const [detailsCardVisible, setDetailsCardVisible] = useState(false)
  const emitter = useEventEmitter()
  const { getMetaObjectById } = useMetaStore()
  useEffect(() => {
    console.log(metaEle)
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
            <MetaDetailsCard onNoteClick={() => setDetailsCardVisible(false)} obj={metaObject} />
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
            border: '1px solid #8590ae',
            borderRadius: 4
          })}
          centered
          contentEditable={false}
          onClick={() => setDetailsCardVisible(!detailsCardVisible)}
        >
          <span>
            <Icon name="park-share-one" />
          </span>
          {metaEle.children[0]?.text}
        </Content>
      </AnimatePopover>
      {children}
    </span>
  )
}

export default MetaObject
