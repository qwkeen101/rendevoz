import { ILabel, ILabelContainerProps } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import { CheckBox } from '@/components'
import { memo, useMemo, useState } from 'react'
import classnames from 'classnames'
import { useDebounceEffect } from '@/hooks'
import { useTranslation } from 'react-i18next'
import Tag from '@/core/object/ObjectTag'
import { Colors } from '@/consts'

const countClass = 'bg-third rounded px-1 font-size-11'
type Value = ILabelContainerProps['labelFilter']
export default memo(
  ({ value, onChange, labelIds, type }: { value: Value; onChange: (v: Value) => void; labelIds?: number[]; type: string }) => {
    const { t } = useTranslation()
    const labels = ObjectStore(type).useMultiple(labelIds) as ILabel[]
    const [innerValue, setInnerValue] = useState(value || {})
    const { note, colors, tags } = useMemo(() => {
      const tags: Map<number, number[]> = new Map()
      const colors: Map<string, number[]> = new Map()
      const note: Map<boolean, number[]> = new Map()
      if (labels) {
        labels.forEach(l => {
          const m = MetaStore.getMetaObjectByObjectId(l.id)
          if (m) {
            if (m.tags?.length) {
              m.tags.forEach(t => {
                tags.set(t, [...(tags.get(t) || []), l.id])
              })
            }
          }
          if (l.color) {
            colors.set(l.color, [...(colors.get(l.color) || []), l.id])
          }
          l.name ? note.set(true, [...(note.get(true) || []), l.id]) : note.set(false, [...(note.get(false) || []), l.id])
        })
      }
      return {
        note,
        colors,
        tags
      }
    }, [labels])
    const tagObjs = ObjectStore('tag').useMultiple(useMemo(() => tags.keys(), [tags]))
    useDebounceEffect(
      () => {
        innerValue !== value && onChange(innerValue)
      },
      [innerValue],
      { wait: 0 }
    )
    const renderTags = () => {
      if (tagObjs.length) {
        return (
          <div>
            <div className={'flex justify-between transparent-font items-center'}>
              <div className={'menu-sub-title pl-2'}>{t('general.Tag')}</div>
            </div>
            {tagObjs
              .sort((b, a) => (tags.get(a.id)?.length ?? 0) - (tags.get(b.id)?.length ?? 0))
              .map(i => {
                const selected = innerValue?.tag?.includes(i.id)
                const size = tags.get(i.id)?.length ?? 0
                return (
                  <div
                    onClick={() => {
                      setInnerValue(s => ({ ...s, tag: selected ? s.tag?.filter(o => o !== i.id) : [...(s.tag || []), i.id] }))
                    }}
                    className={'flex button font-size-13 gap-3 items-center'}
                  >
                    <CheckBox checked={selected} />
                    <Tag tag={i.id} square small hideDelete />
                    <div className={countClass}>{size}</div>
                  </div>
                )
              })}
          </div>
        )
      }
    }
    const renderColors = () => {
      if (colors?.size) {
        return (
          <div>
            <div className={'flex justify-between transparent-font items-center'}>
              <div className={'menu-sub-title pl-2'}>{t('general.color')}</div>
            </div>
            {Array.from(colors.entries())
              .sort((a, b) => b[1].length - a[1].length)
              .map(i => {
                const selected = innerValue?.color?.includes(i[0])
                return (
                  <div
                    onClick={() => {
                      setInnerValue(s => ({ ...s, color: selected ? s.color?.filter(o => o !== i[0]) : [...(s.color || []), i[0]] }))
                    }}
                    className={'flex button font-size-13 gap-3 items-center'}
                  >
                    <CheckBox checked={selected} />
                    <div
                      className={'size-5 rounded'}
                      style={{
                        background: Colors.getAdaptColor(i[0])
                      }}
                    ></div>
                    <div className={countClass}>{i[1].length}</div>
                  </div>
                )
              })}
          </div>
        )
      }
    }
    const renderNote = () => {
      return (
        <div>
          <div className={'flex justify-between transparent-font items-center'}>
            <div className={'menu-sub-title pl-2'}>{t('general.Highlight note')}</div>
          </div>
          <div
            onClick={() => {
              setInnerValue(s => ({ ...s, note: s.note === true ? undefined : true }))
            }}
            className={'flex button font-size-13 gap-3 items-center'}
          >
            <CheckBox checked={innerValue.note === true} />
            <div>{t('general.Note added')}</div>
            {note.get(true)?.length ? <div className={countClass}>{note.get(true)?.length ?? 0}</div> : null}
          </div>
          <div
            onClick={() => {
              setInnerValue(s => ({ ...s, note: s.note === false ? undefined : false }))
            }}
            className={'flex button font-size-13 gap-3 items-center'}
          >
            <CheckBox checked={innerValue.note === false} />
            <div>{t('general.Note not added')}</div>
            {note.get(false)?.length ? <div className={countClass}>{note.get(false)?.length ?? 0}</div> : null}
          </div>
        </div>
      )
    }
    return (
      <div className={'flex px-1 py-3 pb-1 flex-col gap-3 max-h-96 overflow-y-auto w-[240px] rounded-xl'}>
        <div className={'pl-2 font-bold '}>{t('general.Filter')}</div>
        {renderTags()}
        {renderColors()}
        {renderNote()}
      </div>
    )
  }
)
