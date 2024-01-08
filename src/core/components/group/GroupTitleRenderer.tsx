import { Button, Content, Modal } from '@/components'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { ClassName } from 'rendevoz'
import EmojiWithPicker from '@/components/EmojiWithPicker'
import { memo, useEffect, useState } from 'react'
import { Colors, KEY } from '@/consts'
import { MetaStore, ObjectStore } from '@/api/stores'
import { MetaGroup } from '~/typings'
import { useIsIn, useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import InnerFilterer from '@/core/components/group/InnerFilterer'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import isHotkey from 'is-hotkey'
import { useTranslation } from 'react-i18next'

const GroupTitleRenderer = memo(({ groupId }: { groupId: number }) => {
  const group = ObjectStore('group').useValue(groupId) as MetaGroup | undefined
  const groupMeta = MetaStore.useObjectToMetaValue(groupId)
  const [ruleVisible, setRuleVisible] = useState(false)
  const padding = useSelectAtomValue(GroupStateAtom, s => s.pagePadding)
  const { ref, isIn } = useIsIn()
  const [showDescription, setShowDescription] = useState(false)
  const { t } = useTranslation()
  useEffect(() => {
    if (groupMeta) {
      if (groupMeta.description) {
        setShowDescription(true)
      }
    }
  }, [groupMeta?.id])

  return (
    <Content ref={ref} column flex style={{ padding: `24px ${padding}px 0px`, position: 'sticky', left: 0, marginBottom: 8 }}>
      <Modal
        zIndex={5000}
        visible={ruleVisible}
        onClose={() => {
          setRuleVisible(false)
        }}
      >
        <Content flex column style={{ padding: '24px', minWidth: 420 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{t('general.Group automation')}</div>
          <div style={{ fontSize: 13, color: Colors.Font.Transparent }}>
            {t('general.Set rules to automatically add objects into this group')}.
            <div>Tip: Too many automations or rules may slow down application.</div>
          </div>
          <div style={{ fontSize: 13, color: Colors.Font.Transparent }}>Rules</div>
          <InnerFilterer groupId={groupId} />
        </Content>
      </Modal>
      <Content
        flex
        gap={12}
        style={{
          color: Colors.Font.Transparent,
          lineHeight: 1.2,
          opacity: isIn ? 1 : 0,
          transition: 'opacity 0.2s ease',
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 6
        }}
      >
        <Button.IconButton
          text={showDescription ? t('group.Hide description') : t('group.Add description')}
          icon={'park-info'}
          onClick={() => {
            setShowDescription(!showDescription)
          }}
        />
        <Button.IconButton
          text={group?.rootFilterGroup.rules.length ? `${group.rootFilterGroup.rules.length} rules` : t('group.Add rules')}
          icon={'park-filter'}
          onClick={() => {
            setRuleVisible(true)
          }}
        />
      </Content>
      <Content flex alignItems="flex-start" gap={6}>
        <EmojiWithPicker
          emoji={groupMeta?.icon || 'book'}
          onChange={v => {
            if (groupMeta) {
              MetaStore.updateMetaObject({ id: groupMeta.id, icon: v })
            }
          }}
          showPicker={true}
          align={'start'}
          size={{ width: 28, height: 28 }}
          style={{ marginTop: -4 }}
        />
        <AutosizeTextarea
          placeholder={'Untitled'}
          className={ClassName.noStyleInput}
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              e.currentTarget.blur()
              e.preventDefault()
            }
          }}
          defaultValue={groupMeta?.name}
          onBlur={e => {
            if (groupMeta) {
              MetaStore.updateMetaObject({ id: groupMeta.id, name: e.target.value }, true)
            }
          }}
          style={{
            resize: 'none',
            width: '100%',
            fontSize: '28px',
            fontWeight: 700,
            lineHeight: '30px',
            padding: 0
          }}
        ></AutosizeTextarea>
      </Content>
      {showDescription && (
        <AutosizeTextarea
          placeholder={'Add a description...'}
          className={ClassName.noStyleInput}
          style={{
            resize: 'none',
            width: '100%',
            color: Colors.Font.Transparent,
            fontSize: 14
          }}
          minRows={1}
          onBlur={e => {
            if (groupMeta) {
              MetaStore.updateMetaObject({ id: groupMeta.id, description: e.target.value }, true)
            }
          }}
          defaultValue={groupMeta?.description}
        ></AutosizeTextarea>
      )}
    </Content>
  )
})

export default GroupTitleRenderer
