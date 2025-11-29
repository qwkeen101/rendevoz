import { memo, useMemo } from 'react'
import useGraphNodes from '@/core/components/graph/hooks/useGraphNodes'
import useEdges from '@/core/components/graph/hooks/useEdges'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useAtom } from 'jotai'
import useGraphFilter from '@/core/components/graph/hooks/useGraphFilter'
import { Button, Icon } from '@/components'
import { Tab } from '@/components/base/tabs'
import classnames from 'classnames'
import useGraphColor from '@/core/components/graph/hooks/useGraphColor'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { GlobalSetting } from '@/core'
import { useSelectGlobalAtomValue } from '@/hooks'

export default memo(() => {
  const [nodes] = useGraphNodes()
  const [edges] = useEdges()
  const { nodeCount, edgeCount, tags, types } = useMemo(() => {
    const categoried: {
      nodeCount: number
      edgeCount: number
      types: {
        name: string
        items: number[]
      }[]
      tags: {
        id: number
        items: number[]
      }[]
    } = {
      edgeCount: edges.length,
      nodeCount: nodes.length,
      types: [],
      tags: []
    }
    const typeToItems = new Map<string, number[]>()
    const tagToItems = new Map<number, number[]>()
    nodes.forEach(node => {
      if (node.id) {
        const meta = MetaStore.getCachedMetaObject(node.id)
        if (meta) {
          typeToItems.set(meta.type, [...(typeToItems.get(meta.type) || []), node.id])
          meta.tags?.forEach(tag => {
            tagToItems.set(tag, [...(tagToItems.get(tag) || []), node.id])
          })
        }
      }
    })
    categoried.types = Array.from(typeToItems.entries())
      .map(i => ({
        name: i[0],
        items: i[1]
      }))
      .sort((a, b) => b.items.length - a.items.length)
    categoried.tags = Array.from(tagToItems.entries())
      .map(i => ({
        id: i[0],
        items: i[1]
      }))
      .sort((a, b) => b.items.length - a.items.length)
    return categoried
  }, [nodes.length, edges.length])
  useGraphColor(types)
  const { t } = useTranslation()
  return (
    <div className={'flex flex-col overflow-y-auto h-full w-full pb-40 p-3 font-size-13'}>
      <div className={'flex flex-col gap-2 p-2 pb-5 mb-4 border-bottom'}>
        <div className={'font-bold font-size-12'}>{t(trans.Details)}</div>
        <div className={'flex justify-between'}>
          <div>{t('graph.Node count')}</div>
          <div className={'transparent-font'}>{nodeCount}</div>
        </div>
        <div className={'flex justify-between'}>
          <div>{t('graph.Link count')}</div>
          <div className={'transparent-font'}>{edgeCount}</div>
        </div>
      </div>
      <Types types={types} />
      <Tags tags={tags} />
    </div>
  )
})

const Types = ({ types }: { types: { name: string; items: number[] }[] }) => {
  const [filter, setFilter] = useAtom(useGraphFilter.atom)
  const simpleMode = useSelectGlobalAtomValue(GlobalSetting.settingAtom, s => s.graph.simpleMode)
  const hiddenTypes = filter.hiddenTypes
  const action = !hiddenTypes?.length ? 'hide all' : 'show all'
  const handleAction = () => {
    if (action === 'hide all') {
      setFilter(f => ({ ...f, hiddenTypes: types.map(i => i.name) }))
    } else {
      setFilter(f => ({ ...f, hiddenTypes: undefined }))
    }
  }
  const [color, setColor] = useAtom(useGraphColor.atom)
  const colorAction = color.colorBy === 'type' ? 'cancel' : 'group'
  const handleColor = () => {
    if (color.colorBy === 'type') {
      setColor(s => ({ ...s, colorBy: undefined }))
    } else {
      setColor(s => ({ ...s, colorBy: 'type' }))
    }
  }
  const { t } = useTranslation()
  return (
    <div className={'flex font-size-13 flex-col'}>
      <div className={'flex mb-1 font-size-12 items-center pl-2 gap-2'}>
        <div className={'font-bold mr-auto'}>{t(trans.Types)}</div>
        {simpleMode ? (
          <Button.IconButton
            icon={'park-color-filter'}
            text={colorAction === 'cancel' ? t('graph.Remove categorization') : t('graph.Categorize by color')}
            className={'font-size-12 transparent-font'}
            onClick={handleColor}
          ></Button.IconButton>
        ) : null}
        <Button.IconButton
          icon={action === 'hide all' ? 'park-preview-open' : 'park-preview-close'}
          text={action === 'hide all' ? t('general.Hide all') : t('general.Show all')}
          className={'transparent-font'}
          onClick={handleAction}
        ></Button.IconButton>
      </div>
      {types.map(i => (
        <div
          onClick={() => {
            setFilter(f => ({
              ...f,
              hiddenTypes: f.hiddenTypes?.includes(i.name) ? f.hiddenTypes?.filter(o => o !== i.name) : [...(f.hiddenTypes || []), i.name]
            }))
          }}
          className={'flex button items-center gap-3'}
          key={i.name}
        >
          {color.colorBy === 'type' && simpleMode && color.types.has(i.name) && (
            <div
              className={'size-5 rounded'}
              style={{
                background: Colors.getAdaptColor(color.types.get(i.name))
              }}
            ></div>
          )}
          <Tab text={Global.utils.getTypeName(i.name)} count={i.items.length}></Tab>
          <Icon
            className={'hover-active-button ml-auto'}
            name={hiddenTypes?.includes(i.name) ? 'park-preview-close' : 'park-preview-open'}
          />
        </div>
      ))}
    </div>
  )
}

const Tags = ({ tags }: { tags: { id: number; items: number[] }[] }) => {
  const [filter, setFilter] = useAtom(useGraphFilter.atom)
  const simpleMode = useSelectGlobalAtomValue(GlobalSetting.settingAtom, s => s.graph.simpleMode)
  const highlightTags = filter.highlightTags
  const tagsMap = new Map(tags.map(i => [i.id, i]))
  const tagObjs = ObjectStore('tag').useMultiple(useMemo(() => tags.map(i => i.id), [tags]))
  const [color, setColor] = useAtom(useGraphColor.atom)
  const colorAction = color.colorBy === 'tag' ? 'cancel' : 'group'
  const { t } = useTranslation()
  const handleColor = () => {
    if (color.colorBy === 'tag') {
      setColor(s => ({ ...s, colorBy: undefined }))
    } else {
      setColor(s => ({ ...s, colorBy: 'tag' }))
    }
  }
  if (!tagObjs.length) return null
  return (
    <div className={'flex mt-6 font-size-13 flex-col'}>
      <div className={'flex font-size-12 items-center mb-1 pl-2 justify-between'}>
        <div className={'font-bold'}>{t(trans.Tags)}</div>
        {simpleMode && (
          <Button.IconButton
            text={colorAction === 'cancel' ? t('graph.Remove categorization') : t('graph.Categorize by color')}
            icon={'park-color-filter'}
            className={'transparent-font'}
            onClick={handleColor}
          ></Button.IconButton>
        )}
      </div>
      {tagObjs.map(i => (
        <div
          onClick={() => {
            setFilter(f => ({
              ...f,
              highlightTags: f.highlightTags?.includes(i.id) ? f.highlightTags?.filter(o => o !== i.id) : [...(f.highlightTags || []), i.id]
            }))
          }}
          className={'flex button items-center gap-3'}
          key={i.id}
        >
          {color.colorBy === 'tag' && simpleMode && (
            <div
              className={'rounded size-5'}
              style={{
                background: Colors.getAdaptColor(i.color)
              }}
            ></div>
          )}
          <Tab text={i.name} count={tagsMap.get(i.id)?.items?.length} />
          <Icon
            theme={highlightTags?.includes(i.id) ? 'filled' : undefined}
            className={classnames('hover-active-button ml-auto', highlightTags?.includes(i.id) && '!text-yellow-500')}
            name={'park-star'}
          />
        </div>
      ))}
    </div>
  )
}
