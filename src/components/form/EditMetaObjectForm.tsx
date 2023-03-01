import { KEY } from '@/consts/key'
import Zindexes from '@/consts/zindex'
import { useToggle } from '@/hooks'
import { documentsAtom } from '@/stores/document.store'
import createMetaStore, { metaObjectsAtom, tagToMetaObjectIdsMapAtom, useMetaTargetObject } from '@/stores/meta.store'
import { notesAtom } from '@/stores/note.store'
import { globalStore, metaStore } from '@/stores'
import createTagStore, { TagsAtom, TagToTagAtom } from '@/stores/tag.store'
import ClassName from '@/styles/classNames'
import { PartialWithId } from '@/types'
import { hexToRgb } from '@/utils/color'
import Id from '@/utils/id'
import { saveImageLocally } from '@/utils/img'
import { css } from '@emotion/css'
import fuzzysort from 'fuzzysort'
import isHotkey from 'is-hotkey'
import { useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { memo, MouseEventHandler, useEffect, useMemo, useState } from 'react'
import { Flipped, Flipper } from 'react-flip-toolkit'
import { ITag, MetaLink, MetaObject } from '~/typings/data'
import { AnimatePopover, Content, FileUploader, Form, Icon, IconWithPopover, Image, Tooltip, WithBorder } from '../base'
import useFileUpload from '../base/useFileUpload'
import BlockColorPicker from '../editor/components/BlockColorPicker'
import { GlobalGraphInstance } from '../graph/GlobalGraph'
import { TypeToTypeName } from '../database/card/DatabaseCard'
import { defaultBgColor } from '../picker/colorPicker'

const EditMetaObjectForm = ({
  metaObject,
  onUpdate,
  title,
  onClose,
  submitText,
  isCreating = false,
  shouldPreviewGraph = false
}: {
  metaObject?: PartialWithId<MetaObject>
  onUpdate: (newMeta: MetaObject) => void
  onClose: VoidFunction
  title: string
  submitText?: string
  isCreating?: boolean
  shouldPreviewGraph?: boolean
}) => {
  const [innerMeta, setInnerMeta] = useState<PartialWithId<MetaObject>>(metaObject || { id: Id.getId() })
  const [formState, setFormState] = useState<
    Partial<{
      coverVisible: boolean
      mainVisible: boolean
      tagVisible: boolean
    }>
  >({
    mainVisible: true
  })
  const mainFlipId = useMemo(() => Id.getStrId(), [])
  const { renderUploader, upload } = useFileUpload(file => {
    saveImageLocally(Id.getStrId(), file).then(data => {
      console.log(data)
      setInnerMeta({ ...innerMeta, coverImgSrc: data.data })
    })
  }, 'image/*')
  useEffect(() => {
    metaObject && setInnerMeta(structuredClone(metaObject))
  }, [metaObject])

  const renderCoverUploader = () => {
    return (
      <div style={{ width: 400 }}>
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginLeft: 8,
            marginRight: -4
          }}
        >
          <div className={ClassName.title('15px')}>Change Cover</div>
          <Icon name="park-close" onClick={() => setFormState({ mainVisible: true })} className={ClassName.circleButton()} />
        </div>
        {innerMeta.coverImgSrc ? (
          <div style={{ width: '100%', position: 'relative' }}>
            <Image width="100%" style={{ borderRadius: 10 }} src={innerMeta.coverImgSrc} />
            <Icon
              name="park-delete"
              className={ClassName.circleButton()}
              containerStyle={{ position: 'absolute', top: 8, right: 8 }}
              onClick={() => setInnerMeta({ ...innerMeta, coverImgSrc: undefined })}
            />
          </div>
        ) : (
          <FileUploader
            accept="image/*"
            onFileUploaded={file => {
              saveImageLocally(Id.getStrId(), file).then(data => {
                setInnerMeta({ ...innerMeta, coverImgSrc: data.data })
              })
            }}
          />
        )}
      </div>
    )
  }
  const renderTagPicker = () => (
    <TagPicker
      onDelete={tag => {
        setInnerMeta(m => {
          console.log(m, tag)
          m.tags = m.tags?.filter(i => i !== tag)
          return { ...m }
        })
      }}
      onPick={tag => {
        setInnerMeta(m => {
          m.tags = m.tags || []
          !m.tags.some(i => i === tag) && m.tags?.push(tag)
          return { ...m }
        })
      }}
      onClose={() => setFormState({ mainVisible: true })}
      metaObject={innerMeta}
    />
  )

  const renderForm = () => (
    <Form
      onSubmit={() => {
        onUpdate?.(innerMeta)
      }}
      onBack={() => {
        onClose?.()
      }}
      submitText={submitText || 'create'}
      title={title || 'Create Object'}
      style={{ width: '100%', minWidth: 300 }}
    >
      {renderUploader()}
      <Form.Item
        text="Name"
        disable={['note', 'pdf', 'whiteboard'].includes(innerMeta.type) && !isCreating}
        type="input"
        value={innerMeta.name}
        onChange={e => setInnerMeta({ ...innerMeta, name: e })}
      />
      <Form.Item
        text="Description"
        type="textarea"
        maxRows={10}
        value={innerMeta.description}
        onChange={e => setInnerMeta({ ...innerMeta, description: e })}
      />
      {innerMeta.tags && innerMeta.tags.length > 0 && (
        <div
          style={{
            position: 'relative',
            boxShadow: 'rgb(31 34 37 / 6%) 0px 0px 0px 1px inset',
            background: 'rgba(31,34,37,0.03)',
            padding: '12px 8px',
            borderRadius: 6
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: 10,
              fontWeight: 600,
              fontFamily: 'Muli',
              fontSize: 12
            }}
          >
            Tags
          </div>
          <Content flex gap={4} style={{ flexWrap: 'wrap' }}>
            {innerMeta.tags.map(i => (
              <Tag key={i} hideSize small tag={i} />
            ))}
          </Content>
        </div>
      )}
      <Form.Item type="component">
        <div
          style={{
            boxShadow: 'rgb(31 34 37 / 6%) 0px 0px 0px 1px inset',
            borderRadius: 6,
            padding: 8,
            fontSize: 13,
            background: 'rgba(31,34,37,0.03)',
            fontWeight: 500,
            fontFamily: 'Muli'
          }}
        >
          {shouldPreviewGraph && (
            <Content
              onClick={() => GlobalGraphInstance?.open(innerMeta)}
              flex
              alignItems="center"
              justifyContent="space-between"
              className={ClassName.flatButton()}
            >
              <Content gap={8} flex>
                <Icon name="park-share-one" />
                <span>Preview Graph</span>
              </Content>
            </Content>
          )}

          <Content
            alignItems="center"
            justifyContent="space-between"
            flex
            gap={8}
            onClick={() => {
              if (innerMeta.coverImgSrc) {
                setInnerMeta({ ...innerMeta, coverImgSrc: undefined })
              } else {
                upload()
              }
            }}
            className={ClassName.flatButton()}
          >
            <Content gap={8} flex>
              {innerMeta.coverImgSrc ? (
                <>
                  <Icon name="park-delete" />
                  <span>Remove Image</span>
                </>
              ) : (
                <>
                  <Icon name="park-add-pic" />
                  <span>Add Image</span>
                </>
              )}
            </Content>
            {innerMeta.coverImgSrc && (
              <Content
                flex
                centered
                style={{
                  width: 20,
                  height: 20,
                  flexShrink: 0
                }}
              >
                <Image src={innerMeta.coverImgSrc} style={{ borderRadius: 6 }} width="100%" />
              </Content>
            )}
          </Content>

          <Content
            alignItems="center"
            justifyContent="space-between"
            flex
            className={ClassName.flatButton()}
            onClick={() => setFormState({ tagVisible: true })}
          >
            <Content gap={8} flex>
              <Icon name="park-tag-one" />
              <span>Tags</span>
            </Content>
            <Icon name="park-right" />
          </Content>
        </div>
      </Form.Item>
    </Form>
  )
  return (
    <Flipper
      spring={{ stiffness: 1600, damping: 100 }}
      flipKey={`${formState.coverVisible}_${formState.mainVisible}_${formState.tagVisible}`}
    >
      <Flipped flipId={mainFlipId}>
        <div
          className={ClassName.Background.blurBackground}
          style={{
            padding: '16px 24px',
            borderRadius: 8,
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
            overflow: 'hidden'
          }}
        >
          {formState.mainVisible && renderForm()}
          {formState.coverVisible && renderCoverUploader()}
          {formState.tagVisible && renderTagPicker()}
        </div>
      </Flipped>
    </Flipper>
  )
}

const TagPicker = ({
  metaObject,
  onClose,
  onPick,
  onDelete
}: {
  metaObject?: PartialWithId<MetaObject>
  onClose?: VoidFunction
  onPick?: (tag: string) => void
  onDelete?: (tag: string) => void
}) => {
  const { addTag } = createTagStore()
  const [addTagVisible, toggleAddTagVisible] = useToggle(false)
  const [newAddTag, setNewAddTag] = useState<ITag>()
  const TagToMetaObjectIdsMap = useAtomValue(tagToMetaObjectIdsMapAtom, { store: globalStore })
  const allTags = useAtomValue(TagsAtom, { store: globalStore })
  const allTagNames = useMemo(() => Array.from(allTags.values()).map(i => i.name), [allTags])
  const [searchTags, setSearchTags] = useState<ITag[]>([])

  const mostUsedTags = useMemo(() => {
    const tags: { tag: string; size: number }[] = []
    Array.from(TagToMetaObjectIdsMap?.entries()).forEach(([k, v]) => {
      tags.push({
        tag: k,
        size: v.size
      })
    })
    tags.sort((a, b) => b.size - a.size)
    const newTags = tags.slice(0, 20)
    return newTags
  }, [TagToMetaObjectIdsMap])

  useEffect(() => {
    if (newAddTag?.name) {
      const result = fuzzysort.go(newAddTag?.name, Array.from(allTags.values()), { key: 'name' })
      setSearchTags(Array.from(result.values()).map(i => i.obj))
    }
  }, [newAddTag?.name])

  const alreadyHasTag = useMemo(() => {
    return allTagNames.some(i => i === newAddTag?.name)
  }, [newAddTag?.name])
  return (
    <div style={{ width: 300 }}>
      <Icon
        name="park-close"
        containerStyle={{ position: 'absolute', top: 10, right: 10, color: 'rgba(31,34,39,0.6)' }}
        className={ClassName.circleButton()}
        onClick={onClose}
      />
      <div className={ClassName.title('15px')}>Select Tags For Object</div>
      <div className={ClassName.description()}>You can select multiple tags for your object.</div>
      <Content flex gap={8} alignItems="center" style={{ padding: '10px 0', flexWrap: 'wrap' }}>
        {metaObject?.tags?.map(i => (
          <Tag key={i} hideSize onDelete={() => onDelete?.(i)} tag={i} />
        ))}
        {addTagVisible && (
          <AnimatePopover
            visible={addTagVisible && newAddTag?.name}
            positions={['bottom']}
            reposition={false}
            content={
              <WithBorder style={{ padding: 6, minWidth: 200 }}>
                {!alreadyHasTag && (
                  <Content flex alignItems="center" gap={10}>
                    <Content
                      onClick={e => {
                        setSearchTags([])
                        newAddTag && addTag(newAddTag)
                        setNewAddTag(undefined)
                        toggleAddTagVisible(false)
                        newAddTag?.name && onPick?.(newAddTag?.name)
                      }}
                      flex
                      alignItems="center"
                      gap={10}
                      style={{ fontSize: 13 }}
                      className={ClassName.flatButton()}
                    >
                      Create Tag
                      <span
                        style={{
                          color: newAddTag?.color ? 'white' : 'rgb(82,102,116)',
                          borderRadius: 4,
                          background: newAddTag?.color || 'rgb(220,227,232)',
                          padding: '2px 6px'
                        }}
                      >
                        {newAddTag?.name}
                      </span>
                    </Content>
                    <IconWithPopover
                      onClick={e => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      content={
                        <WithBorder>
                          <BlockColorPicker
                            showBg
                            showFont={false}
                            onPickBackgroundColor={e => {
                              if (e === defaultBgColor) {
                                setNewAddTag({ ...newAddTag, color: undefined })
                              } else {
                                setNewAddTag({ ...newAddTag, color: e })
                              }
                            }}
                          />
                        </WithBorder>
                      }
                      size={14}
                      name="park-background-color"
                      zIndex={Zindexes.Tooltip}
                      disableIntersection
                      className={ClassName.circleButton()}
                    />
                  </Content>
                )}
                {searchTags.length > 0 && (
                  <>
                    {!alreadyHasTag && (
                      <div style={{ height: 1, width: '100%', background: 'rgb(222,222,222,0.6)', margin: '0 auto' }}></div>
                    )}
                    <Content flex column style={{ padding: '8px 0px', maxHeight: 400, overflowY: 'auto' }}>
                      {searchTags.map(i => (
                        <div
                          onClick={() => {
                            setSearchTags([])
                            setNewAddTag(undefined)
                            toggleAddTagVisible(false)
                            i.name && onPick?.(i.name)
                          }}
                          className={ClassName.flatButton(undefined, undefined, 'rgba(31,34,39,0.1)')}
                        >
                          <Tag small hideSize key={i.name} tag={i.name} />
                        </div>
                      ))}
                    </Content>
                  </>
                )}
              </WithBorder>
            }
            containerStyle={{ zIndex: String(Zindexes.Tooltip) }}
          >
            <div
              style={{
                position: 'relative',
                color: newAddTag?.color ? 'white' : 'rgb(82,102,116)',
                display: 'flex',
                borderRadius: '999px',
                background: newAddTag?.color || 'rgb(220,227,232)',
                padding: '3px 10px 3px 10px'
              }}
            >
              <input
                autoFocus
                onKeyDown={e => {
                  if (isHotkey(KEY.Enter, e)) {
                    setSearchTags([])
                    newAddTag && addTag(newAddTag)
                    setNewAddTag(undefined)
                    toggleAddTagVisible(false)
                    newAddTag?.name && onPick?.(newAddTag?.name)
                  }
                  if (isHotkey(KEY.Escape, e)) {
                    setSearchTags([])
                    setNewAddTag(undefined)
                    toggleAddTagVisible(false)
                  }
                }}
                style={{
                  fontFamily: 'Muli',
                  background: 'transparent',
                  outline: 'none',
                  border: 'none'
                }}
                onChange={e => setNewAddTag({ ...newAddTag, name: e.target.value })}
                spellCheck="false"
              ></input>
              <Icon
                onClick={() => {
                  setSearchTags([])
                  setNewAddTag(undefined)
                  toggleAddTagVisible(false)
                }}
                className={ClassName.circleButton()}
                name="park-close"
              />
            </div>
          </AnimatePopover>
        )}
        <div
          onClick={toggleAddTagVisible}
          className={ClassName.circleButton()}
          style={{
            color: 'rgb(82,102,116)',
            border: '1px solid rgba(82, 102, 116, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            lineHeight: 1
          }}
        >
          <Icon name="park-plus" size={14} />
          {metaObject?.tags?.length === 0 && <span style={{ marginTop: -2, marginRight: 6 }}>Add One Tag</span>}
        </div>
      </Content>
      <div style={{ margin: '20px 0px 10px' }} className={ClassName.description()}>
        MOST USED TAGS
      </div>
      <Content flex alignItems="center" gap={8} style={{ flexWrap: 'wrap' }}>
        {mostUsedTags?.map(i => (
          <Tag
            key={i.tag}
            cursor="pointer"
            onAdd={() => {
              onPick?.(i.tag)
            }}
            hideDelete
            tag={i.tag}
          />
        ))}
      </Content>
    </div>
  )
}
export const Tag = ({
  tag,
  hideSize,
  hideDelete,
  onDelete,
  hideAdd,
  hideDetails,
  onAdd,
  small,
  onClick,
  cursor
}: {
  tag: string
  hideSize?: boolean
  hideDelete?: boolean
  hideAdd?: boolean
  hideDetails?: boolean
  onDelete?: VoidFunction
  small?: boolean
  cursor?: string
  onClick?: MouseEventHandler
  onAdd?: VoidFunction
}) => {
  const TagToMetaObjectMap = useMemo(() => atom(get => get(tagToMetaObjectIdsMapAtom)), [])
  const tagMap = useAtomValue(TagToMetaObjectMap, { store: globalStore })
  const tagToObjectsSet = tagMap.get(tag)
  const tagToObjectArray = tagToObjectsSet && Array.from(tagToObjectsSet)
  const tagObject = useAtomValue(TagToTagAtom, { store: globalStore }).get(tag)

  const size = tagToObjectsSet?.size
  const [tagDetailsVisible, toggleTagDetailsVisible] = useToggle(false)
  const [pointerInTag, togglePointerInTag] = useToggle(false)
  return (
    <AnimatePopover
      containerStyle={{
        zIndex: String(Zindexes.Tooltip)
      }}
      padding={10}
      visible={!hideDetails && tagDetailsVisible}
      onClickOutside={toggleTagDetailsVisible}
      content={
        <WithBorder style={{ padding: 10, minWidth: 250, maxHeight: 400, overflowY: 'auto' }}>
          {tagToObjectArray && tagToObjectArray.length > 0 ? (
            tagToObjectArray?.map(i => <TagTargetObject id={i} />)
          ) : (
            <div className={ClassName.description()}>No related objects</div>
          )}
        </WithBorder>
      }
    >
      <Content
        flex
        alignItems="center"
        gap={6}
        onClick={onClick}
        onPointerEnter={() => togglePointerInTag(true)}
        onPointerLeave={() => togglePointerInTag(false)}
        style={{
          background: tagObject?.color || 'rgb(220,227,232)',
          color: tagObject?.color ? 'white' : 'rgb(82,102,116)',
          borderRadius: small ? '4px' : '999px',
          padding: small ? '0px 6px 0px 6px' : '3px 6px 3px 10px',
          fontFamily: 'Muli',
          width: 'fit-content',
          fontSize: small ? 12 : 14,
          cursor,
          whiteSpace: 'nowrap'
        }}
      >
        <Tooltip disable={tagDetailsVisible || hideDetails} position="top" content="Click to see objects with this tag.">
          <Content onClick={toggleTagDetailsVisible} flex gap={4}>
            <span>{tag}</span>
            {!hideSize && (
              <Content flex style={{ width: 16, textAlign: 'center' }}>
                {(pointerInTag || tagDetailsVisible) && !hideAdd ? (
                  <Icon
                    name="park-plus"
                    onClick={e => {
                      e.stopPropagation()
                      onAdd?.()
                    }}
                    className={ClassName.circleButton(2)}
                  />
                ) : (
                  <span>{size}</span>
                )}
              </Content>
            )}
          </Content>
        </Tooltip>
        {!small && !hideDelete && (
          <Icon
            size={12}
            onClick={e => {
              e.stopPropagation()
              onDelete?.()
            }}
            className={ClassName.circleButton(3)}
            name="park-close"
          />
        )}
      </Content>
    </AnimatePopover>
  )
}
const TagTargetObject = ({ id }: { id: number }) => {
  const result = useMetaTargetObject(id)
  if (!result) return null
  const { metaObject, targetObject } = result
  const name = targetObject?.title || targetObject?.name || metaObject.name
  const type = TypeToTypeName[metaObject.type]
  return (
    <Content style={{ fontSize: 13 }} gap={10} flex justifyContent="space-between">
      <div>{name}</div>
      <div className={ClassName.tag()}>{type}</div>
    </Content>
  )
}

export default memo(EditMetaObjectForm)
