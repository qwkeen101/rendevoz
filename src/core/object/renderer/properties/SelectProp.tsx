import { Content, Selector } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import { CSSProperties } from 'react'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { PopupWrapper } from '@/core/components/group/components'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'

export default ({
  value,
  style,
  onChange,
  className,
  fieldName,
  metaId,
  optionStyle
}: {
  fieldName: string
  value?: number
  style?: CSSProperties
  optionStyle?: CSSProperties
  className?: string
  onChange?: (id: number | undefined) => void
  metaId: number
}) => {
  const allOptionIds = MetaStore.usePropOptions(fieldName)
  const options = ObjectStore('metaPropSelectOption').useMultiple(allOptionIds)
  const selected = value
  const selectedOption = ObjectStore('metaPropSelectOption').useValue(selected)

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
        className={className}
        style={{
          width: '100%',
          height: '100%',
          ...style
        }}
      >
        {selectedOption && (
          <div
            style={{
              padding: '0px 6px',
              fontSize: 14,
              borderRadius: 3,
              lineHeight: '20px',
              width: 'fit-content',
              height: 'fit-content',
              whiteSpace: 'pre-wrap',
              color: Colors.getAdaptFontColor(selectedOption?.color),
              background: Colors.getAdaptColor(selectedOption?.color) || Colors.Background.ButtonHover,
              ...optionStyle
            }}
            className={ClassName.ellipsisFont(1)}
          >
            {selectedOption?.name}
          </div>
        )}
      </Content>
      {renderPopover(box => (
        <PopupWrapper box={{ ...box, width: 300 }}>
          <div style={{ width: '100%' }}>
            <Selector
              onItemDelete={id => ObjectStore('metaPropSelectOption').deleteOneById(id)}
              onItemUpdate={t => ObjectStore('metaPropSelectOption').updateOne(t)}
              onCreateItem={(name, color) => {
                closePopover()
                ObjectStore('metaPropSelectOption')
                  .addOne({ name, color, parentPropName: fieldName })
                  .then(i => {
                    MetaStore.updateProperty(metaId, fieldName, {
                      value: i.id
                    })
                  })
              }}
              onSelect={items => {
                if (items.length) {
                  closePopover()
                  onChange?.(items[0].id)
                } else {
                  onChange?.(undefined)
                }
              }}
              selectedItems={selectedOption ? [selectedOption] : []}
              mode={'single'}
              items={options}
            />
          </div>
        </PopupWrapper>
      ))}
    </>
  )
}
