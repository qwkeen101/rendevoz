import { Content, Icon } from '@/components'
import { ObjectStore, globalStore } from '@/stores'
import { metaObjectsAtom, objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import { Fragment, memo, useEffect, useState } from 'react'
import { useRenderObject } from '../database'
import { GlobalSearchInputAtom, SearchGroup } from './SearchDialog'

import ClassName from '@/styles/classNames'
import { useGlobalAtomValue, useToggle } from '@/hooks'
import Colors from '@/consts/colors'
import { css } from '@emotion/css'
import Actions from '../Actions'
import { selectBlock } from '../editor/utils/blockActions'
import { SearchStore } from '@/stores/search.store'

const SearchResultItem = ({ group, onNavi }: { group: SearchGroup; onNavi: VoidFunction }) => {
  const [metaId, setMetaId] = useState<number>()
  const [showChildren, toggleShowChildren] = useToggle(false)
  const objectIdToMetaObjectIdMap = globalStore.get(objectIdToMetaObjectIdMapAtom)
  useEffect(() => {
    const setMeta = async () => {
      let metaExist = false
      if (group.type === 'note') {
        const targetNote = await ObjectStore('note').getOneById(Number(group.id))
        if (targetNote?.metaId) {
          if (globalStore.get(metaObjectsAtom).has(targetNote.metaId)) {
            setMetaId(targetNote.metaId)
            metaExist = true
          } else {
            ObjectStore('note').deleteOneById(targetNote.id, { silent: true, force: true })
          }
          return
        }
      }
      const metaId = objectIdToMetaObjectIdMap?.get(Number(group.id))
      if (metaId) {
        metaExist = true
      }
      if (!metaExist) {
        SearchStore.deleteDocuments(group.items.map(i => i.id))
      }
      setMetaId(metaId)
    }
    setMeta()
  }, [])
  if (!metaId) {
    return null
  }
  return (
    <Content
      flex
      column
      gap={5}
      className={css({
        ':not(:last-child)': {
          borderBottom: `1px solid ${Colors.Background.HighContrast}`
        },
        padding: '6px 0px'
      })}
    >
      {metaId && (
        <Content>
          <Icon
            containerStyle={{
              position: 'absolute',
              left: -30,
              top: '50%',
              transform: 'translateY(-50%)'
            }}
            style={{
              transform: showChildren ? 'rotate(90deg)' : undefined,
              transition: 'transform 0.3s ease'
            }}
            className={ClassName.circleButton()}
            name="park-right"
            onClick={toggleShowChildren}
          />
          <SearchDetails metaId={metaId} onNavi={onNavi} />
          {!showChildren && group.items.length > 1 && <div className={ClassName.description('12px')}>{group.items.length} Results</div>}
        </Content>
      )}
      {!showChildren && <div dangerouslySetInnerHTML={{ __html: group.items[0].content }} className={ClassName.description('14px')}></div>}
      {metaId && showChildren && (
        <ol
          style={{
            listStyle: 'none',
            marginBottom: 0,
            paddingLeft: 0,
            borderLeft: `1px solid ${Colors.Background.HighContrast}`
          }}
          className={css({
            counterReset: 'my-counter',
            li: {
              display: 'flex',
              counterIncrement: 'my-counter',
              '::before': {
                content: 'counter(my-counter) "."',
                marginRight: 10
              }
            },
            '> *': {
              ':not(:last-child)': {
                borderBottom: `1px solid ${Colors.Background.Border}`
              }
            }
          })}
        >
          {group.items.map(i => (
            <Fragment key={i.id}>
              {i.specType === 'pdfPage' && <PdfSearchResult item={i} onNavi={onNavi} />}
              {i.specType === 'noteBlock' && (
                <NoteSearchResult
                  item={i}
                  onClick={() => {
                    onNavi()
                    if (metaId) {
                      const targetMeta = globalStore.get(metaObjectsAtom).get(metaId)
                      if (targetMeta?.type === 'note') {
                        Actions.openEditor(Number(i.targetObjectId)).then(editor => {
                          selectBlock(Number(i.id), editor)
                        })
                      }
                      if (targetMeta?.type === 'webpage') {
                        Actions.openWebpage(targetMeta?.objectId!).then(webpage => {
                          webpage.transformToNote().then(editor => {
                            selectBlock(Number(i.id), editor)
                          })
                        })
                      }
                    }
                  }}
                />
              )}
            </Fragment>
          ))}
        </ol>
      )}
    </Content>
  )
}

const PdfSearchResult = ({ item, onNavi }: { item: { specType: 'pdfPage' } & SearchGroup['items'][0]; onNavi: VoidFunction }) => {
  const globalSearch = useGlobalAtomValue(GlobalSearchInputAtom)
  return (
    <li
      className={ClassName.flatButton(4, '8px')}
      onClick={() => {
        onNavi()
        Actions.goToPdfSearchedText(globalSearch, Number(item.pageIndex), Number(item.targetObjectId))
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: item.content }}></div>
    </li>
  )
}

const NoteSearchResult = ({
  item,
  onClick
}: {
  item: { specType: 'noteBlock' } & SearchGroup['items'][0]
  onClick: React.MouseEventHandler
}) => (
  <li className={ClassName.flatButton(4, '8px')} onClick={onClick}>
    <div dangerouslySetInnerHTML={{ __html: item.content }}></div>
  </li>
)

const SearchDetails = memo(({ metaId, onNavi }: { metaId: number; onNavi: VoidFunction }) => {
  const { renderTags, renderTitle } = useRenderObject({ metaObjectId: metaId })
  return (
    <>
      {renderTags({})}
      {renderTitle({
        onTitleClick: () => {
          Actions.navigateToTargetObject(metaId)
          onNavi()
        }
      })}
    </>
  )
})
export default SearchResultItem
