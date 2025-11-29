import { ToolbarV2, WithBorder } from '@/components'
import { useDebounceFn, useMemoizedFn } from '@/hooks'
import { MetaStore } from '@/api/stores'
import { useState } from 'react'
import { GraphEdge } from '../../types/edge'
import useGraph from '@/core/components/graph/hooks/useGraph'
import { Icons } from '@/consts'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import BlockColorPicker from '@/core/components/editor/components/BlockColorPicker'
const EdgeAttributeCard = ({ currentEdge }: { currentEdge?: GraphEdge }) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const { updateMetaLink } = MetaStore
  const { t } = useTranslation()
  const updateEdge = useMemoizedFn((edge: Partial<GraphEdge>) => {
    if (currentEdge) {
      debouncedUpdateLink({
        id: currentEdge.id,
        ...edge
      })
    }
  })
  const { run: debouncedUpdateLink } = useDebounceFn(updateMetaLink, {
    wait: 200
  })
  if (isUpdating) {
    return (
      <input
        className={'px-3 py-1.5 w-64'}
        defaultValue={currentEdge.label}
        autoFocus
        onChange={e => {
          updateEdge({ label: e.target.value })
        }}
      />
    )
  }
  return (
    <ToolbarV2
      layout={[
        {
          type: 'button',
          key: 'edit',
          icon: Icons.Edit,
          text: t(trans.Edit),
          onClick: () => {
            setIsUpdating(true)
          }
        },
        {
          type: 'button',
          key: 'bg-color',
          text: t(trans.Color),
          icon: 'park-background-color',
          positions: ['top', 'bottom'],
          padding: 10,
          popover: setV => (
            <WithBorder>
              <BlockColorPicker
                showFont={false}
                bgBackDefault={false}
                onPickBackgroundColor={v => {
                  updateEdge({
                    color: v
                  })
                  setV(false)
                }}
              />
            </WithBorder>
          )
        },
        {
          text: t(trans.Delete),
          type: 'button',
          key: 'delete',
          icon: Icons.Delete,
          onClick: () => {
            if (currentEdge) {
              MetaStore.deleteMetaLink(currentEdge.id)
            }
          }
        }
      ]}
    />
  )
}
export default EdgeAttributeCard
