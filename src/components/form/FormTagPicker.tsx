import { KEY } from '@/consts/key'
import Zindexes from '@/consts/zindex'
import { useToggle } from '@/hooks'
import { tagToMetaObjectIdsMapAtom } from '@/stores/meta.store'
import { globalStore, ObjectStore } from '@/stores'
import ClassName from '@/styles/classNames'
import fuzzysort from 'fuzzysort'
import isHotkey from 'is-hotkey'
import { useAtomValue } from 'jotai'
import { CSSProperties, useEffect, useMemo, useState } from 'react'
import { ITag } from '~/typings/data'
import { AnimatePopover, Button, Icon, IconWithPopover } from '..'
import { Content, WithBorder } from '../base'
import BlockColorPicker from '@/core/editor/components/BlockColorPicker'
import { defaultBgColor } from '../picker/colorPicker'
import { useTranslation } from 'react-i18next'
import { css } from '@emotion/css'
import { ObjectTag } from '@/core'
import Colors from '@/consts/colors'
import MetaTagPicker from '@/core/object/MetaTagPicker'

const FormTagPicker = ({
  onClose,
  style,
  tags = [],
  onChange
}: {
  onClose?: VoidFunction
  style?: CSSProperties
  onChange?: (tags: number[]) => void
  tags?: number[]
}) => {
  return (
    <div style={{ width: 460, minHeight: 400, ...style }}>
      <Content
        flex
        justifyContent={'space-between'}
        alignItems={'center'}
        style={{
          marginBottom: 6,
          textTransform: 'capitalize'
        }}
        className={ClassName.description()}
      >
        <div>Manage tags</div>
        <Icon
          name="park-close"
          className={ClassName.circleButton()}
          onClick={() => {
            onClose?.()
          }}
        />
      </Content>
      <MetaTagPicker alreadyTags={tags} onChange={tags => onChange?.(tags)} />
    </div>
  )
}

export default FormTagPicker
