import { Button, Content } from '@/components'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { ClassName } from 'rendevoz'
import EmojiWithPicker from '@/components/EmojiWithPicker'
import { useState } from 'react'
import { Colors } from '@/consts'
import { MetaStore, ObjectStore } from '@/stores'
import { MetaGroup } from '~/typings'
import useGroupQueryLibrary from '@/core/group/hooks/queryLibrary/useGroupQueryLibrary'

const GroupTitleRenderer = ({ groupId }: { groupId: number }) => {
  const [isIn, setIsIn] = useState(false)
  const group = ObjectStore('group').useValue(groupId) as MetaGroup | undefined
  const groupMeta = MetaStore.useObjectToMetaValue(groupId)
  const { open, renderPanel } = useGroupQueryLibrary(groupId)
  // if (!groupMeta) return null
  return (
    <Content column flex onPointerEnter={() => setIsIn(true)} onPointerLeave={() => setIsIn(false)}>
      {renderPanel()}
      <Content flex alignItems="flex-start" gap={6}>
        <EmojiWithPicker emoji="book" showPicker={true} align={'start'} size={{ width: 28, height: 28 }} />
        <input
          placeholder={'Untitled'}
          className={ClassName.noStyleInput}
          defaultValue={groupMeta?.name}
          onBlur={(e => MetaStore.updateMetaObject({ id: groupMeta.id, name: e.target.value }), true)}
          style={{
            resize: 'none',
            width: 'fit-content',
            fontSize: '28px',
            fontWeight: 700,
            lineHeight: '30px',
            maxWidth: 600
          }}
        ></input>
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
        <Button.IconButton
          onClick={() => open()}
          style={{ padding: '2px 6px', border: `1px solid ${Colors.Background.Border}` }}
          icon="park-filter"
          text={`${group?.rootFilterGroup.rules.length}个规则`}
        />
      </Content>
    </Content>
  )
}

export default GroupTitleRenderer
