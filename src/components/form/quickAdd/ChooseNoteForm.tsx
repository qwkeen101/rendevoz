import { Editor, useSetting, IconNameRenderer } from '@/core'
import { Content, Icon } from '@/components'
import ButtonSelect from '@/components/base/ButtonSelect'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { IEditorInstance, MetaObject } from '~/typings'
import { MetaStore, NoteStore, ObjectStore } from '@/api/stores'
import Id from '@/utils/id'
import produce from 'immer'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import fuzzysort from 'fuzzysort'
import { useDebounceEffect } from '@/hooks'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import { useTranslation } from 'react-i18next'

export default memo(({ metaId, onBack, onClose }: { metaId: number; onBack: VoidFunction; onClose: VoidFunction }) => {
  const [setting, setSetting] = useSetting()
  const notePosition = setting.quickAdd.addIntoNote
  const metaType = setting.quickAdd.noteMetaType
  const hideObject = setting.quickAdd.addIntoNoteHideObject
  const [allNotes, setAllNotes] = useState<(MetaObject & {})[]>([])
  const [currentSelectId, setCurrentSelectId] = useState<number>()
  const [currentValue, setCurrentValue] = useState<import('slate').Descendant[]>([])
  const [currentTitle, setCurrentTitle] = useState('')
  const id = useMemo(() => Id.getStrId(), [])
  const instanceRef = useRef<IEditorInstance>()
  const [displayNotes, setDisplayNotes] = useState<(MetaObject & {})[]>([])
  const [search, setSearch] = useState('')
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  useLayoutEffect(() => {
    if (currentSelectId) {
      setIsLoading(true)
      const element =
        metaType === 'inline'
          ? {
              type: 'paragraph',
              id: Id.getId(),
              children: [
                { text: '' },
                { type: 'inline-metaObject', id: Id.getId(), children: [{ text: '' }], originId: metaId },
                { text: '' }
              ]
            }
          : {
              type: 'metaObject',
              id: Id.getId(),
              children: [{ text: '' }],
              originId: metaId
            }
      ObjectStore('note')
        .getOneById(currentSelectId)
        .then(note => {
          if (note && note.contentId) {
            NoteStore.getNoteValue(note.contentId)
              .then(value => {
                const noteValue = value || []
                setCurrentValue(notePosition === 'first' ? [element, ...noteValue] : [...noteValue, element])
              })
              .catch(e => {
                setCurrentValue([element])
              })
          }
        })
    }
  }, [currentSelectId, notePosition, metaType])
  useEffect(() => {
    const allNotesIds = Array.from(MetaStore.getIndexedMetaObjects()?.typeToMetaObjectIdsMap.get('note')?.values() || [])
    const all = allNotesIds.map(i => MetaStore.getMetaObjectsMap().get(i)).filter(i => MetaStore.isVisibleMetaObject(i)) as MetaObject[]
    all.sort((a, b) => b.createdAt - a.createdAt)
    setAllNotes(all)
  }, [])
  useLayoutEffect(() => {
    if (currentValue) {
      instanceRef.current?.replaceChildren?.(currentValue)
      setTimeout(() => {
        instanceRef.current?.scrollToBlock?.({
          blockId: notePosition === 'last' ? currentValue[currentValue.length - 1].id : currentValue[0].id
        })
      }, 0)
      setTimeout(() => {
        setIsLoading(false)
      }, 200)
    }
  }, [currentValue])
  useDebounceEffect(
    () => {
      if (search) {
        if (allNotes.length) {
          const result = fuzzysort.go(search, allNotes, { key: 'name' })
          setDisplayNotes(Array.from(result.values()).map(i => i.obj))
        }
      } else {
        if (displayNotes.length) {
          setDisplayNotes([])
        }
      }
    },
    [search],
    { wait: 300 }
  )
  const handleAddIntoNote = async () => {
    onClose()
    if (currentValue && currentSelectId) {
      await NoteStore.updateNoteValue(currentValue, currentSelectId)
      const noteMeta = MetaStore.getMetaObjectByObjectId(currentSelectId)
      if (noteMeta) {
        setTimeout(() => {
          if (setting.quickAdd.addIntoNoteAutoOpen) {
            Rendevoz.Actions.Open.Meta.openMetaObject(noteMeta.id)
          }
        })
        MetaStore.addMetaLink(
          {
            sourceId: metaId,
            targetId: noteMeta.id
          },
          true
        )
      }
    }
  }

  return (
    <Content flex alignItems={'stretch'} style={{ width: 'min(1100px, 90vw)', minWidth: '550px', height: 'min(80vh, 800px)' }}>
      <Content
        flex
        column
        style={{
          padding: 8,
          width: 300,
          fontSize: 14
        }}
      >
        <Content flex alignItems={'center'} style={{ marginBottom: 8 }} gap={12} className={ClassName.title()}>
          <Icon name={'park-left'} onClick={onBack} className={ClassName.circleButton()} />
          <div>{t('general.Add into note')}</div>
        </Content>
        <ButtonSelect
          onSelect={v => {
            setSetting(s =>
              produce(s, draft => {
                draft.quickAdd.addIntoNote = v[0]
              })
            )
          }}
          value={notePosition}
          name={t('general.Add into')}
          options={[
            {
              value: 'last',
              children: t('general.Last')
            },
            {
              value: 'first',
              children: t('general.First')
            }
          ]}
        />
        <ButtonSelect
          onSelect={v => {
            setSetting(s =>
              produce(s, draft => {
                draft.quickAdd.noteMetaType = v[0]
              })
            )
          }}
          options={[
            {
              value: 'inline',
              children: t('general.Inline block')
            },
            {
              value: 'block',
              children: t('general.Paragraph block')
            }
          ]}
          value={metaType}
          name={t('general.Block type')}
        />
        <ButtonSwitch
          name={t('general.Hide object')}
          value={hideObject}
          onChange={v =>
            setSetting(s =>
              produce(s, draft => {
                draft.quickAdd.addIntoNoteHideObject = v
              })
            )
          }
        ></ButtonSwitch>
        <ButtonSwitch
          value={setting.quickAdd.addIntoNoteAutoOpen}
          name={t('general.Auto open')}
          onChange={v => {
            setSetting(s =>
              produce(s, draft => {
                draft.quickAdd.addIntoNoteAutoOpen = v
              })
            )
          }}
        />
        <input
          className={ClassName.noStyleInput}
          value={search}
          onChange={v => {
            setSearch(v.target.value)
          }}
          style={{
            padding: '3px 8px',
            fontSize: 14
          }}
          placeholder={t('general.Type to search') + '...'}
        />
        <Content flex column style={{ overflowY: 'auto', borderTop: `1px solid ${Colors.Background.Border}`, marginTop: 4, paddingTop: 4 }}>
          {(displayNotes.length ? displayNotes : allNotes).map(i => (
            <IconNameRenderer
              name={i.name}
              className={ClassName.flatButton()}
              icon={i.icon || Rendevoz.Utils.Object.getMetaObjectIcon(i.type)}
              key={i.id}
              onClick={() => {
                setCurrentSelectId(i.objectId)
                setCurrentTitle(i.name)
              }}
            ></IconNameRenderer>
          ))}
        </Content>
      </Content>
      <Content
        fullHeight
        fullWidth
        flex
        column
        style={{
          padding: '8px 16px',
          background: Colors.Background.Global,
          borderLeft: '1px solid var(--border-background)',
          overflow: 'hidden',
          borderRadius: '0 8px 8px 0'
        }}
      >
        <Content
          flex
          justifyContent={'space-between'}
          className={ClassName.title()}
          style={{
            marginBottom: 6,
            paddingBottom: 6,
            borderBottom: '1px solid var(--border-background)'
          }}
        >
          <div>{t('general.Preview')}</div>
          {currentValue && currentSelectId && (
            <div
              className={ClassName.selectButton()}
              style={{
                height: 'fit-content',
                fontSize: 14,
                padding: '2px 10px'
              }}
              onClick={handleAddIntoNote}
            >
              {t('general.OK')}
            </div>
          )}
        </Content>
        <div
          style={{
            width: '100%',
            height: 0,
            flex: 1,
            position: 'relative'
          }}
        >
          {isLoading && (
            <Content
              flex
              fullWidth
              fullHeight
              centered
              style={{ zIndex: 10, position: 'absolute', inset: 0, background: Colors.Background.Global }}
            >
              <Icon name={'park-loading-four'} spin size={32} />
            </Content>
          )}
          {currentSelectId && currentValue && (
            <Editor
              onInstanceInitialized={i => (instanceRef.current = i)}
              layout={{
                showHeader: false,
                showToolbar: false,
                showBlockHandle: false,
                showHoverObjectDetails: false
              }}
              id={id}
              stringTitle={currentTitle}
              readOnly={true}
              styles={{
                pageMinPadding: '0px 20px 0px 0px'
              }}
              title={{
                titleContainerStyle: {
                  padding: '12px 0px 12px'
                }
              }}
              state={{
                fontSize: 14,
                lineSpacing: 1.4
              }}
              defaultValue={currentValue}
            />
          )}
        </div>
      </Content>
    </Content>
  )
})
