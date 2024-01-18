import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useLayoutEffect, useMemo } from 'react'
import { atom, useAtom, useSetAtom, useStore } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

export default () => {
  const instance = useGroupInstance()
  const store = useStore()
  const subViewIdAtom = useMemo(() => {
    const viewIdAtom = selectAtom(GroupStateAtom, s => s.data?.lastViewId)
    const sub = atom(get => {
      const id = get(viewIdAtom)
      const allViews = store.get(GroupStateAtom).data?.views
      store.set(GroupStateAtom, {
        ...store.get(GroupStateAtom),
        currentView: id ? allViews?.find(i => i.id === id) : allViews?.[0]
      })
    })
    return sub
  }, [])
  const subViewPropsAtom = useMemo(() => {
    const optionsAtom = selectAtom(GroupStateAtom, s => s.currentView?.options.properties)
    const propsAtom = selectAtom(GroupStateAtom, s => s.data?.properties)
    const onlyShowCustomAtom = selectAtom(GroupStateAtom, s => s.data?.onlyShowCustomProperties)
    const invisiblePropsAtom = selectAtom(GroupStateAtom, s => s.state?.invisibleProperties)
    const finalWriteAtom = atom(get => {
      const currentViewProps = get(optionsAtom)
      const allProps = get(propsAtom)
      get(onlyShowCustomAtom)
      get(invisiblePropsAtom)
      if (!currentViewProps || !allProps) {
        return
      }
      const invisiblePropIds = instance.viewOps?.getInvisibleViewPropertyIds()
      const filteredAllProps = allProps.filter(i => !invisiblePropIds?.has(i.id))
      const visibleProps = new Set(instance.viewOps?.getVisibleProperties()?.map(i => i.id))

      const sortedProps = filteredAllProps
        .slice()
        .map(i => ({ ...i, width: currentViewProps[i.id]?.width ?? 150, visible: visibleProps.has(i.id) }))
        .sort((a, b) => currentViewProps[a.id]?.order - currentViewProps[b.id]?.order)
      const visibleSorted = sortedProps.filter(i => i.visible)
      store.set(GroupStateAtom, {
        ...store.get(GroupStateAtom),
        visibleProperties: visibleSorted,
        currentViewProperties: sortedProps,
        showOriginalText: visibleSorted.some(i => i.name === 'originalText'),
        headerColumn: visibleSorted.map(i => `${i.width! + 1}px`).join(' '),
        tableWidth: visibleSorted.reduce((prev, curr) => prev + curr.width!, 0) + 35
      })
    })
    return finalWriteAtom
  }, [])
  useAtom(subViewIdAtom)
  useAtom(subViewPropsAtom)
}
