import KeyvalueStore from '@/stores/keyvalue.store'
import { ButtonChooser, CheckBox, Content, Icon } from '@/components'
import { Reorder } from 'framer-motion'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
import _ from 'lodash'
import { Colors } from '@/consts'
import { useRef } from 'react'
const GalleryConfig = () => {
  const allPanels = KeyvalueStore.useValue('homeGallery')
  const { t } = useTranslation()
  const rows = KeyvalueStore.useValue('homeGalleryRows') || 1
  const isDragging = useRef(false)
  return (
    <>
      <Reorder.Group
        as={'div'}
        onReorder={v => KeyvalueStore.updateOne('homeGallery', { ...allPanels, visibleLists: v })}
        values={allPanels?.visibleLists || []}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}
      >
        {allPanels?.visibleLists.map((l, index) => (
          <Reorder.Item
            onDragStart={() => (isDragging.current = true)}
            onDragEnd={() => {
              setTimeout(() => {
                isDragging.current = false
              })
            }}
            as={'div'}
            value={l}
            key={l.name}
          >
            <Content
              flex
              gap={10}
              onClick={e => {
                if (e.target.closest('input')) return
                if (isDragging.current) return
                allPanels.visibleLists[index].visible = !l.visible
                KeyvalueStore.updateOne('homeGallery', {
                  ...allPanels,
                  visibleLists: [...allPanels.visibleLists]
                })
              }}
              alignItems={'center'}
              className={ClassName.flatButton()}
            >
              <CheckBox
                checked={l.visible}
                onChange={v => {
                  allPanels.visibleLists[index].visible = v
                  KeyvalueStore.updateOne('homeGallery', {
                    ...allPanels,
                    visibleLists: [...allPanels.visibleLists]
                  })
                }}
              ></CheckBox>
              <div>{t(`general.${l.name}`)}</div>
              <Icon name={'park-drag'} className={ClassName.flatButton(4, 2)} containerStyle={{ marginLeft: 'auto', cursor: 'grab' }} />
            </Content>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <ButtonChooser
        buttonSize={12}
        style={{ borderTop: `1px solid ${Colors.Background.Border}`, padding: '6px 8px 0px', marginTop: 6, fontWeight: 600 }}
        value={`${rows}`}
        name={'Rows'}
        options={_.range(1, 5).map(i => i.toString())}
        onChange={v => {
          const n = parseInt(v)
          if (n >= 1 && n <= 5) {
            KeyvalueStore.updateOne('homeGalleryRows', n)
          }
        }}
      />
    </>
  )
}

export default GalleryConfig
