import { Content, Selector } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import { CSSProperties } from 'react'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { PopupWrapper } from '@/core/components/group/components'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'

export default ({
  metaId,
  fieldName,
  style,
  onChange,
  value,
  className
}: {
  metaId: number
  fieldName: string
  value?: number[]
  style?: CSSProperties
  className?: string
  onChange?: (ids: number[]) => void
}) => {
  const allOptionIds = MetaStore.usePropOptions(fieldName)
  const options = ObjectStore('metaPropSelectOption').useMultiple(allOptionIds)

  const selected = value
  const selectedOptions = ObjectStore('metaPropSelectOption').useMultiple(selected)
  const { openPopover, closePopover, renderPopover } = usePopoverCell()

  return (
    <>
      <Content
        role={'prop-container'}
        onClick={e => {
          const parent = e.currentTarget.parentElement
          if (!parent) return
          openPopover(parent)
        }}
        flex
        gap={6}
        className={className}
        style={{
          flexWrap: 'inherit',
          width: '100%',
          height: 'fit-content',
          ...style
        }}
      >
        {selectedOptions.map(selectedOption => (
          <div
            className={ClassName.ellipsisFont(1)}
            key={selectedOption.id}
            style={{
              padding: '0px 6px',
              fontSize: 14,
              borderRadius: 3,
              lineHeight: '20px',
              width: 'fit-content',
              flexShrink: 0,
              height: 'fit-content',
              whiteSpace: 'pre-wrap',
              color: Colors.getAdaptFontColor(selectedOption.color),
              background: Colors.getAdaptColor(selectedOption?.color) || Colors.Background.ButtonHover
            }}
          >
            {selectedOption?.name}
          </div>
        ))}
      </Content>
      {renderPopover(box => (
        <PopupWrapper box={{ ...box, width: 300 }}>
          <div style={{ width: '100%' }}>
            <Selector
              onItemDelete={id => ObjectStore('metaPropSelectOption').deleteOneById(id)}
              onItemUpdate={t => ObjectStore('metaPropSelectOption').updateOne(t)}
              onCreateItem={(name, color) => {
                ObjectStore('metaPropSelectOption')
                  .addOne({ name, color, parentPropName: fieldName })
                  .then(i => {
                    MetaStore.updateProperty(metaId, fieldName, {
                      value: [...(selected || []), i.id]
                    })
                  })
              }}
              onSelect={items => {
                if (items.length) {
                  onChange?.(items.map(i => i.id))
                } else {
                  onChange?.([])
                }
              }}
              selectedItems={selectedOptions}
              mode={'multi'}
              items={options}
            />
          </div>
        </PopupWrapper>
      ))}
    </>
  )
}
