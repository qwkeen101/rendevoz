import { AnimatePopover, Content, Icon, Image, WithBorder } from '@/components/base'
import { useTheme } from '@/hooks'
import useMetaStore from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { FC, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { RenderElementProps } from 'slate-react'
import { MetaKnowledgeObject } from '~/typings/data'
import { MetaObjectElement } from '../../types/outerElementTypes'
import NoteCard from '../cards/NoteCard'
import MetaDetailsCard from './MetaDetailsCard'

const MetaObject: FC<RenderElementProps> = ({ children, element, attributes }) => {
  const metaEle = element as MetaObjectElement
  const [metaObject, setMetaObject] = useState<MetaKnowledgeObject>()
  const [detailsCardVisible, setDetailsCardVisible] = useState(false)
  const { getMetaObjectById } = useMetaStore()
  const { defaultBorderColorCream } = useTheme('defaultBorderColorCream')
  const hasDescription = metaObject?.description
  useEffect(() => {
    metaEle.originId && getMetaObjectById(metaEle.originId).then(obj => setMetaObject(obj))
  }, [element, getMetaObjectById])
  const renderMain = () => (
    <AnimatePopover
      positions={['bottom', 'top']}
      align="start"
      reposition
      visible={detailsCardVisible}
      containerStyle={{ zIndex: '10000' }}
      onClickOutside={() => setDetailsCardVisible(false)}
      boundaryInset={20}
      boundaryElement={document.body}
      disableIntersection
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
        className={css([
          {
            color: '#8590ae',
            margin: '0 1.1px',
            display: 'inline-flex !important',
            padding: hasDescription ? 4 : 2,
            cursor: 'pointer',
            gap: 7,
            border: `1px solid ${defaultBorderColorCream}`,
            borderRadius: 4,
            maxWidth: 300
          },
          ClassName.title('13px')
        ])}
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
        {metaObject?.coverImgSrc && (
          <Image
            src={metaObject?.coverImgSrc}
            width={hasDescription ? 42 : 21}
            className={css({
              borderRadius: '4px',
              height: hasDescription ? 42 : 21,
              minWidth: 'unset'
            })}
          />
        )}
        <Content flex column>
          <span
            className={css([
              ClassName.title('13px'),
              {
                lineHeight: '18px',
                ':not(:last-child)': {
                  marginTop: -4
                }
              },
              ClassName.ellipsisFont(1)
            ])}
          >
            {metaObject?.name}
          </span>
          {metaObject?.description && (
            <span className={css([ClassName.description('12px'), { lineHeight: '14px' }, ClassName.ellipsisFont(2)])}>
              {metaObject?.description}
            </span>
          )}
        </Content>
      </Content>
    </AnimatePopover>
  )
  return <NoteCard main={renderMain()} element={element} children={children} noteId={metaObject?.noteId} />
}

export default MetaObject
