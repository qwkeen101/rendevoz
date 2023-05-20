import { KEY } from '@/consts/key'
import Zindexes from '@/consts/zindex'
import { useToggle } from '@/hooks'
import { tagToMetaObjectIdsMapAtom } from '@/stores/meta.store'
import { ObjectStore, globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import fuzzysort from 'fuzzysort'
import isHotkey from 'is-hotkey'
import { useAtomValue } from 'jotai'
import { useState, useMemo, useEffect, CSSProperties } from 'react'
import { ITag } from '~/typings/data'
import { Icon, AnimatePopover, IconWithPopover, Button } from '..'
import { Content, WithBorder } from '../base'
import BlockColorPicker from '@/core/editor/components/BlockColorPicker'
import { defaultBgColor } from '../picker/colorPicker'
import { useTranslation } from 'react-i18next'
import { css } from '@emotion/css'
import { ObjectTag } from '@/core'
import Colors from '@/consts/colors'

const FormTagPicker = ({
  onClose,
  style,
  tags = [],
  onChange
}: {
  onClose?: VoidFunction
  style?: CSSProperties
  onChange?: (tags: number[]) => void
  tags?: number[]
}) => {
  const [addTagVisible, toggleAddTagVisible] = useToggle(false)
  const [newAddTag, setNewAddTag] = useState<ITag>()
  const TagToMetaObjectIdsMap = useAtomValue(tagToMetaObjectIdsMapAtom, { store: globalStore })
  const allTags = useAtomValue(ObjectStore('tag').objectMapAtom, { store: globalStore })
  const allTagNames = useMemo(() => Array.from(allTags.values()).map(i => !i.deleted && i.name), [allTags])
  const [searchTags, setSearchTags] = useState<ITag[]>([])
  const [showTagManager, toggleShowTagManager] = useToggle(false)
  const { t } = useTranslation()
  const mostUsedTags = useMemo(() => {
    const tags: { tag: number; size: number }[] = []
    Array.from(TagToMetaObjectIdsMap?.entries() || []).forEach(([k, v]) => {
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
    <div style={{ width: 300, ...style }} className={css({ '> div': { textTransform: 'capitalize' } })}>
      <Icon
        name="park-close"
        containerStyle={{ position: 'absolute', top: 10, right: 10 }}
        className={ClassName.circleButton()}
        onClick={() => {
          if (showTagManager) {
            toggleShowTagManager()
          } else {
            onClose?.()
          }
        }}
      />
      {showTagManager ? (
        <TagManager />
      ) : (
        <>
          <div className={ClassName.title('15px')}>{t('form.select tags', { tags: t('general.tags') })}</div>
          <div className={ClassName.description()}>{t('form.you can select multiple tags', { tags: t('general.tags') })}</div>
          <Content flex gap={8} alignItems="center" style={{ padding: '10px 0', flexWrap: 'wrap' }}>
            {tags?.map(i => (
              <ObjectTag key={i} hideSize onDelete={() => onChange?.(tags.filter(o => o !== i))} tag={i} />
            ))}
            {addTagVisible && (
              <AnimatePopover
                visible={addTagVisible && !!newAddTag?.name}
                positions={['bottom']}
                reposition={false}
                content={
                  <WithBorder style={{ padding: 6, minWidth: 200 }}>
                    {!alreadyHasTag && (
                      <Content flex alignItems="center" gap={10}>
                        <Content
                          onClick={e => {
                            setSearchTags([])
                            if (newAddTag?.name) {
                              ObjectStore('tag')
                                .addOne(newAddTag)
                                .then(tag => {
                                  setNewAddTag(undefined)
                                  toggleAddTagVisible(false)
                                  onChange?.([...tags, tag.id])
                                })
                            }
                          }}
                          flex
                          alignItems="center"
                          gap={10}
                          style={{ fontSize: '1rem' }}
                          className={ClassName.flatButton()}
                        >
                          {`${t('general.create')} ${t('general.tag')}`}
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
                                if (i.name) {
                                  onChange?.([...tags, i.id])
                                }
                              }}
                              className={ClassName.flatButton(undefined, undefined, 'rgba(31,34,39,0.1)')}
                            >
                              <ObjectTag small hideSize key={i.name} tag={i.id} />
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
                        if (newAddTag?.name) {
                          ObjectStore('tag')
                            .addOne(newAddTag)
                            .then(tag => {
                              setNewAddTag(undefined)
                              toggleAddTagVisible(false)
                              onChange?.([...tags, tag.id])
                            })
                        }
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
                border: `1px solid ${Colors.Background.Border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '1rem',
                lineHeight: 1
              }}
            >
              <Icon name="park-plus" size={14} />
              {tags?.length === 0 && <span style={{ marginTop: -2, marginRight: 6 }}>Add One Tag</span>}
            </div>
          </Content>
          <div style={{ margin: '20px 0px 10px', textTransform: 'uppercase' }} className={ClassName.description()}>
            {t('form.most used tags', { tags: t('general.tags') })}
          </div>
          <Content flex alignItems="center" gap={8} style={{ flexWrap: 'wrap' }}>
            {mostUsedTags?.map(i => (
              <ObjectTag
                key={i.tag}
                cursor="pointer"
                onAdd={() => {
                  onChange?.([...tags, i.tag])
                }}
                hideDelete
                tag={i.tag}
              />
            ))}
          </Content>
          <Button.IconButton
            reverse
            spaceBetween
            icon="park-right"
            text="管理标签"
            style={{
              marginTop: 10
            }}
            onClick={toggleShowTagManager}
          ></Button.IconButton>
        </>
      )}
    </div>
  )
}

const TagManager = () => {
  const allTags = useAtomValue(ObjectStore('tag').objectMapAtom, { store: globalStore })
  return (
    <Content flex column style={{ maxHeight: 500, minWidth: 300, overflowY: 'auto' }} gap={10}>
      <div className={ClassName.title('15px')} style={{ marginBottom: 10 }}>
        管理标签
      </div>
      {Array.from(allTags.entries()).map(entry => {
        const tag = entry[1]
        if (tag.deleted) return null
        return (
          <Content flex gap={10}>
            <ObjectTag
              style={{ width: '100%' }}
              tag={tag.id}
              hideDelete
              hideAdd
              showDBRemove
              showPickColor
              showEdit
              hideSize
              onDBRemove={() => ObjectStore('tag').deleteOneById(entry[0], { force: true })}
            />
          </Content>
        )
      })}
    </Content>
  )
}

export default FormTagPicker
