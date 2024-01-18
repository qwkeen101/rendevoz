import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import { Content, Icon, IconWithPopover, Selector, VirtualList, WithBorder } from '@/components'
import Tag from '@/core/object/ObjectTag'
import { ClassName } from 'rendevoz'
import { CSSProperties, forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import isHotkey from 'is-hotkey'
import { Colors, KEY } from '@/consts'
import { useGlobalAtomValue } from '@/hooks'
import fuzzysort from 'fuzzysort'
import BlockColorPicker from '@/core/components/editor/components/BlockColorPicker'
import FontSize from '@/consts/font'
import { Virtualizer } from '@tanstack/react-virtual'
import { useTranslation } from 'react-i18next'

const MetaTagPicker = forwardRef(
  (
    {
      style,
      selectMode,
      alreadyTags = [],
      onChange
    }: { style?: CSSProperties; selectMode?: boolean; alreadyTags?: number[]; onChange?: (tags: number[]) => void },
    ref
  ) => {
    const allTags = ObjectStore('tag').useAll()
    const selectedTags = ObjectStore('tag').useMultiple(alreadyTags)
    const sortedTags = useMemo(() => {
      if (allTags) {
        return allTags.slice().sort((b, a) => (b.order ?? -1) - (a.order ?? -1))
      }
    }, [allTags])
    return (
      <Content flex column style={{ ...style, maxWidth: 'min(90vw, 480px)' }} ref={ref}>
        <Selector
          selectMode={selectMode}
          selectedItems={selectedTags}
          items={sortedTags}
          mode={'multi'}
          onSelect={items => {
            if (items.length) {
              onChange?.(items.map(i => i.id))
            } else {
              onChange?.([])
            }
          }}
          onCreateItem={(name, color) => ObjectStore('tag').addOne({ name, color })}
          onItemDelete={t => ObjectStore('tag').deleteOneById(t, { force: true })}
          onItemUpdate={t => ObjectStore('tag').updateOne(t)}
        />
      </Content>
    )
  }
)

export default MetaTagPicker
