import { AnimatePopover, Button, Content, IconWithPopover, WithBorder } from '@/components'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { ClassName } from 'rendevoz'
import EmojiWithPicker from '@/components/EmojiWithPicker'
import { useState } from 'react'
import InnerFilterer from '@/core/database/group/InnerFilterer'
import FontSize from '@/consts/font'
import { Colors } from '@/consts'
import { ObjectStore } from '@/stores'
import { MetaFilterGroup, MetaGroup } from '~/typings'

const GroupTitleRenderer = ({ groupId }: { groupId: number }) => {
  const [isIn, setIsIn] = useState(false)
  const group = ObjectStore('group').useValue(groupId) as MetaGroup | undefined
  return (
    <Content column flex onPointerEnter={() => setIsIn(true)} onPointerLeave={() => setIsIn(false)}>
      <Content flex alignItems="flex-start" gap={6}>
        <EmojiWithPicker emoji="book" showPicker={true} align={'start'} size={{ width: 28, height: 28 }} />
        <AutosizeTextarea
          placeholder={'Untitled'}
          className={ClassName.noStyleInput}
          style={{
            resize: 'none',
            width: 'fit-content',
            fontSize: '28px',
            fontWeight: 700,
            lineHeight: '30px',
            maxWidth: 600
          }}
          minRows={1}
        ></AutosizeTextarea>
      </Content>
      <AutosizeTextarea
        defaultValue={'Add a description...'}
        className={ClassName.noStyleInput}
        style={{
          resize: 'none',
          width: '100%'
        }}
        minRows={1}
      ></AutosizeTextarea>
      <Content
        flex
        gap={6}
        style={{
          // opacity: isIn ? 1 : 0,
          transition: 'opacity 0.3s ease',
          fontSize: 12
        }}
      >
        <AnimatePopover
          positions={['bottom']}
          align={'start'}
          withClickCover={true}
          content={
            <WithBorder style={{ padding: '12px 16px', minWidth: 300, position: 'relative' }}>
              <Content flex column gap={8} style={{ lineHeight: 1, marginBottom: 10 }}>
                <div className={ClassName.title(FontSize['14px'])}>筛选实体库</div>
                <div className={ClassName.description(FontSize['12px'])}>筛选器会自动将符合条件的实体添加到组中</div>
              </Content>
              <IconWithPopover
                align="start"
                placement={['right']}
                name={'park-more'}
                content={<div>123</div>}
                className={ClassName.circleButton()}
                containerStyle={{
                  position: 'absolute',
                  top: 6,
                  right: 6
                }}
              />
              <InnerFilterer groupId={groupId} />
            </WithBorder>
          }
        >
          <Button.IconButton
            style={{ padding: '2px 6px', border: `1px solid ${Colors.Background.Border}` }}
            icon="park-filter"
            text={`${group?.rootFilterGroup.rules.length}个规则`}
          />
        </AnimatePopover>
      </Content>
    </Content>
  )
}

export default GroupTitleRenderer
