import { Editor, useSetting, IconNameRenderer } from '@/core'
import { Content, Icon, Menu } from '@/components'
import ButtonSelect from '@/components/base/ButtonSelect'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { IEditorInstance, MetaObject } from '~/typings'
import { MetaStore, NoteStore, ObjectStore } from '@/api/stores'
import Id from '@/utils/id'
import produce from 'immer'
import { ClassName } from 'rendevoz'
import { Colors, KEY } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import fuzzysort from 'fuzzysort'
import { useDebounceEffect } from '@/hooks'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import { useTranslation } from 'react-i18next'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import updateMovetoCache from '@/components/form/quickAdd/updateMovetoCache'
import isHotkey from 'is-hotkey'
import quickAdd from '@/components/form/quickAdd/quickAdd'
import useMoveToCache from '@/components/form/quickAdd/useMoveToCache'

export default memo(({ metaId, onBack, onClose }: { metaId: number[]; onBack: VoidFunction; onClose: VoidFunction }) => {
  const [setting, setSetting] = useSetting()
  const cache = useMoveToCache()?.note
  const notePosition = setting.quickAdd.addIntoNote
  const metaType = setting.quickAdd.noteMetaType
  const hideObject = setting.quickAdd.addIntoNoteHideObject
  const moveToShowInvisible = KeyvalueStore.useValue('moveToShowInvisible')

  const [currentValue, setCurrentValue] = useState<import('slate').Descendant[]>([])
  const [currentTitle, setCurrentTitle] = useState('')
  const id = useMemo(() => Id.getStrId(), [])
  const instanceRef = useRef<IEditorInstance>()
  const [displayNotes, setDisplayNotes] = useState<MetaObject[]>()
  const [search, setSearch] = useState('')
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const index = MetaStore.useMetaObjectsMap()
  const allNotes = useMemo(() => {
    const all = Array.from(index.values()).filter(
      i => (!moveToShowInvisible ? MetaStore.isVisibleMetaObject(i) : true) && i.type === 'note'
    )
    all.sort((a, b) => b.createdAt - a.createdAt)
    return all
  }, [index, moveToShowInvisible])
  const [currentSelectId, setCurrentSelectId] = useState<number>(
    cache?.id ? (allNotes.some(i => i.objectId === cache.id) ? cache.id : undefined) : undefined
  )
  useLayoutEffect(() => {
    if (currentSelectId) {
      updateMovetoCache(c => (c.note = { id: currentSelectId }))
      setIsLoading(true)
      const element =
        metaType === 'inline'
          ? [
              {
                type: 'paragraph',
                id: Id.getId(),
                children: [
                  { text: '' },
                  ...metaId.map(i => ({ type: 'inline-metaObject', id: Id.getId(), children: [{ text: '' }], originId: i })),
                  { text: '' }
                ]
              }
            ]
          : [...metaId.map(i => ({ type: 'metaObject', id: Id.getId(), children: [{ text: '' }], originId: i }))]
      ObjectStore('note')
        .getOneById(currentSelectId)
        .then(note => {
          if (note && note.contentId) {
            NoteStore.getNoteValue(note.contentId)
              .then(value => {
                const noteValue = value || []
                setCurrentValue(notePosition === 'first' ? [...element, ...noteValue] : [...noteValue, ...element])
              })
              .catch(e => {
                setCurrentValue([...element])
              })
          }
        })
    }
  }, [currentSelectId, notePosition, metaType])

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
        setDisplayNotes(undefined)
      }
    },
    [search],
    { wait: 300 }
  )
  const handleAddIntoNote = async () => {
    onClose()
    if (currentValue && currentSelectId) {
      quickAdd(metaId, 'note', currentSelectId)
    }
  }

  return (
    <Content flex alignItems={'stretch'} style={{ width: 'min(1400px, 95vw)', minWidth: '550px', height: 'min(90vh, 1000px)' }}>
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
        <ButtonSwitch
          name={t('general.Show hidden objects')}
          value={!!moveToShowInvisible}
          onChange={v => KeyvalueStore.updateOne('moveToShowInvisible', v)}
        />
        <input
          autoFocus
          onKeyDownCapture={e => {
            if (isHotkey(KEY.Escape, e)) {
              e.preventDefault()
              e.stopPropagation()
              e.currentTarget.blur()
            }
          }}
          className={'border-box-shadow focus-input'}
          style={{ padding: '3px 8px', borderRadius: 4, margin: '6px 8px' }}
          placeholder={t('general.Type to search') + '...'}
          value={search}
          onChange={e => {
            setSearch(e.target.value)
          }}
        />
        <Content flex column style={{ overflowY: 'auto', paddingTop: 4 }}>
          <Menu.NavigationMenu
            layout={[
              search
                ? undefined
                : {
                    text: t('general.Create new document'),
                    icon: 'park-plus',
                    type: 'item',
                    key: 'create',
                    onSelect: () => {
                      ObjectStore('note').addOneWithMeta({})
                    }
                  },
              ...(displayNotes || allNotes).map(i => ({
                text: i.name || i.placeholderName || 'Untitled',
                icon: Rendevoz.Utils.Object.getMetaObjectIcon('note'),
                type: 'item',
                style:
                  currentSelectId === i.objectId
                    ? {
                        background: Colors.Common.SelectColorTransparentLight,
                        color: Colors.Common.SelectColor
                      }
                    : undefined,
                key: i.id,
                onSelect: () => {
                  setCurrentSelectId(i.objectId)
                  setCurrentTitle(i.name)
                }
              }))
            ].filter(i => i)}
          />
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
              {t('general.Add')}
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
