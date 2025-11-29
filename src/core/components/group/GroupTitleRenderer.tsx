import { Button, Content, Icon, Modal, AutosizeTextarea } from '@/components'
import EmojiWithPicker from '@/components/EmojiWithPicker'
import { memo, useState } from 'react'
import { Colors, KEY } from '@/consts'
import { MetaGroup } from '~/typings'
import { useIsIn, useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import InnerFilterer from '@/core/components/group/InnerFilterer'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import isHotkey from 'is-hotkey'
import { useTranslation } from 'react-i18next'
import { isEqual } from 'lodash'
import classnames from 'classnames'
import metaGroupRuleHandler from '@/api/stores/meta/metaGroupRuleHandler'
import trans from '@/consts/trans'

const GroupTitleRenderer = memo(
  ({ title, description, groupValue, icon }: { title?: string; description?: string; groupValue?: MetaGroup; icon?: string }) => {
    const [ruleVisible, setRuleVisible] = useState(false)
    const instance = useGroupInstance()
    const { showDescription, groupStyles, groupLayoutSetting, groupTitleSetting, padding } = useSelectAtomValue(
      GroupStateAtom,
      s => ({
        showDescription: s.data?.descriptionVisible,
        groupTitleSetting: s.title,
        groupLayoutSetting: s.layout,
        groupStyles: s.styles,
        padding: s.pagePadding
      }),
      { compare: isEqual }
    )
    const { ref, isIn } = useIsIn()
    const { t } = useTranslation()
    return (
      <Content
        ref={ref}
        column
        flex
        style={{ padding: `24px ${padding}px 0px`, position: 'sticky', left: 0, marginBottom: 18, ...groupStyles?.titleContainerStyle }}
      >
        <Modal
          zIndex={5000}
          visible={ruleVisible}
          onClose={() => {
            setRuleVisible(false)
            metaGroupRuleHandler()
          }}
        >
          <div className={'p-6 w-[90vw] max-w-xl'}>
            <div className={'text-2xl font-bold'}>{t('general.Group automation')}</div>
            <div className={'transparent-font mt-1'}>{t('general.Set rules to automatically add objects into this group')}</div>
            <InnerFilterer filterGroup={groupValue?.rootFilterGroup} />
          </div>
        </Modal>
        {groupLayoutSetting?.showTitleActions !== false && (
          <div
            className={'super-transparent-font mb-1.5 -ml-1 -mt-2 flex gap-3 items-center font-size-13 transition-opacity'}
            style={{
              opacity: isIn || groupValue?.rootFilterGroup.rules.length ? 1 : 0
            }}
          >
            <Button.IconButton
              text={showDescription ? t('group.Hide description') : t('group.Add description')}
              icon={'park-edit'}
              theme={'filled'}
              onClick={() => {
                instance.updateGroupData?.(w => {
                  return {
                    ...w,
                    descriptionVisible: !w.descriptionVisible
                  }
                })
              }}
            />
            <Button.IconButton
              text={
                groupValue?.rootFilterGroup.rules.length
                  ? t('group.Rules', { count: groupValue.rootFilterGroup.rules.length })
                  : t('group.Add rules')
              }
              icon={'park-lightning'}
              theme={'filled'}
              onClick={() => {
                setRuleVisible(true)
              }}
            />
          </div>
        )}
        <div className={'flex items-start gap-2'}>
          {groupLayoutSetting?.showIcon !== false ? (
            icon && (icon.startsWith('park') || icon.startsWith('custom')) ? (
              <Icon name={icon} className={'text-3xl mt-1.5 mr-1'} />
            ) : null
          ) : null}
          {/*<EmojiWithPicker*/}
          {/*  emoji={icon || 'book'}*/}
          {/*  onChange={v => {*/}
          {/*    console.log(v)*/}
          {/*    instance.on?.({*/}
          {/*      type: 'groupMetaChange',*/}
          {/*      value: {*/}
          {/*        icon: v*/}
          {/*      }*/}
          {/*    })*/}
          {/*  }}*/}
          {/*  showPicker={true}*/}
          {/*  align={'start'}*/}
          {/*  size={{ width: '2rem', height: '2rem' }}*/}
          {/*/>*/}
          <AutosizeTextarea
            placeholderColor={'primary'}
            disabled={groupTitleSetting?.titleEditable === false}
            placeholder={t(trans.Untitled)}
            className={classnames('w-full font-bold p-0', groupStyles?.titleClassName)}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                e.currentTarget.blur()
                e.preventDefault()
              }
            }}
            value={title}
            onChange={v => {
              instance.on?.({
                type: 'groupMetaChange',
                value: {
                  name: v
                }
              })
            }}
            debounceChange
            style={{
              resize: 'none',
              fontSize: 30,
              lineHeight: 1.2
            }}
          ></AutosizeTextarea>
        </div>
        {showDescription && groupLayoutSetting?.showDescription !== false && (
          <AutosizeTextarea
            disabled={groupTitleSetting?.descriptionEditable === false}
            placeholder={'Add a description...'}
            className={classnames('w-full mt-2 transparent-font', groupStyles?.descriptionClassName)}
            style={{
              resize: 'none'
            }}
            onBlur={e => {
              instance.on?.({
                type: 'groupMetaChange',
                value: {
                  description: e.target.innerText
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
