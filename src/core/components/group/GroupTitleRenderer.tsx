import { Button, Content, Icon, Modal } from '@/components'
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

const GroupTitleRenderer = memo(
  ({ title, description, groupValue, icon }: { title?: string; description?: string; groupValue?: MetaGroup; icon?: string }) => {
    const [ruleVisible, setRuleVisible] = useState(false)
    const padding = useSelectAtomValue(GroupStateAtom, s => s.pagePadding)
    const { ref, isIn } = useIsIn()
    const [showDescription, setShowDescription] = useState(false)
    const { t } = useTranslation()
    const instance = useGroupInstance()
    const groupLayoutSetting = useSelectAtomValue(GroupStateAtom, s => s.layout)
    const groupTitleSetting = useSelectAtomValue(GroupStateAtom, s => s.title)
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
            <InnerFilterer filterGroup={groupValue?.rootFilterGroup} />
          </Content>
        </Modal>
        {groupLayoutSetting?.showTitleActions !== false && (
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
              text={groupValue?.rootFilterGroup.rules.length ? `${groupValue.rootFilterGroup.rules.length} rules` : t('group.Add rules')}
              icon={'park-filter'}
              onClick={() => {
                setRuleVisible(true)
              }}
            />
          </Content>
        )}
        <Content flex alignItems="flex-start" gap={6}>
          {groupLayoutSetting?.showIcon !== false ? (
            icon && (icon.startsWith('park') || icon.startsWith('custom')) ? (
              <Icon
                name={icon}
                size={28}
                style={{
                  marginRight: 8,
                  marginTop: 2
                }}
              />
            ) : (
              <EmojiWithPicker
                emoji={icon || 'book'}
                onChange={v => {
                  console.log(v)
                  instance.on?.({
                    type: 'groupMetaChange',
                    value: {
                      icon: v
                    }
                  })
                }}
                showPicker={true}
                align={'start'}
                size={{ width: 28, height: 28 }}
                style={{ marginTop: -4 }}
              />
            )
          ) : null}
          <AutosizeTextarea
            disabled={groupTitleSetting?.titleEditable === false}
            placeholder={t('general.untitled')}
            className={ClassName.noStyleInput}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                e.currentTarget.blur()
                e.preventDefault()
              }
            }}
            defaultValue={title}
            onBlur={e => {
              instance.on?.({
                type: 'groupMetaChange',
                value: {
                  name: e.target.value
                }
              })
            }}
            style={{
              resize: 'none',
              width: '100%',
              fontSize: '28px',
              fontWeight: 500,
              lineHeight: '30px',
              padding: 0
            }}
          ></AutosizeTextarea>
        </Content>
        {showDescription && groupLayoutSetting?.showDescription !== false && (
          <AutosizeTextarea
            disabled={groupTitleSetting?.descriptionEditable === false}
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
              instance.on?.({
                type: 'groupMetaChange',
                value: {
                  description: e.target.value
                }
              })
            }}
            defaultValue={description}
          ></AutosizeTextarea>
        )}
      </Content>
    )
  }
)

export default GroupTitleRenderer
