import { CheckBox, Content } from '@/components'
import useRenderObject from './useRenderObject'
import FontSize from '@/consts/font'
import { IMetaAttachment } from '~/typings'
import NameEditor from '../../components/base/ContentEditor'
import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import AutosizeTextarea from '@/components/custom/input/AutoSizeTextArea'

const AttachmentObject = ({
  showHoverObject = true,
  showSelect,
  onSelect,
  selected,
  attachment,
  renderAttOnParent,
  renderObjectDetailsOnParent = true,
  onChange
}: {
  showHoverObject: boolean
  showSelect?: boolean
  onSelect?: (selected: boolean) => void
  selected?: boolean
  attachment: IMetaAttachment
  renderAttOnParent?: boolean
  renderObjectDetailsOnParent?: boolean
  onChange: (att: IMetaAttachment) => void
}) => {
  if (attachment.type !== 'attachmentText') {
    const metaId = attachment.id
    const { renderInline } = useRenderObject({ metaObjectId: metaId })

    return (
      <Content
        flex
        alignItems="center"
        gap={6}
        onClick={() => {
          if (!showSelect) {
            return
          } else {
            onSelect?.(!selected)
          }
        }}
      >
        {showSelect && <CheckBox style={{ width: 14, height: 14, fontSize: 12, borderRadius: 2 }} checked={selected}></CheckBox>}

        {renderInline({
          ellipsisLine: 1,
          renderAttOnParent,
          onClick: showSelect
            ? () => {
                onSelect?.(!selected)
              }
            : undefined,
          showCircle: false,
          showUnderline: showHoverObject ? true : false,
          showHoverObjectDetails: showHoverObject,
          renderObjectDetailsOnParent,
          containerStyle: { fontSize: FontSize['12px'] }
        })}
      </Content>
    )
  } else {
    return (
      <Content
        flex
        alignItems="center"
        gap={6}
        style={{ cursor: 'pointer' }}
        className={ClassName.description(FontSize['12px'])}
        onClick={() => {
          if (!showSelect) {
            return
          } else {
            onSelect?.(!selected)
          }
        }}
      >
        {showSelect && <CheckBox style={{ width: 14, height: 14, fontSize: 12, borderRadius: 2 }} checked={selected}></CheckBox>}
        <AutosizeTextarea
          placeholder={'Edit text...'}
          onBlur={e => {
            onChange({ ...attachment, text: e.target.innerText })
          }}
          onClick={e => e.stopPropagation()}
          defaultValue={attachment.text}
          className={ClassName.noStyleInput}
          style={{ padding: 0, width: '100%', resize: 'none' }}
          spellCheck={'false'}
        ></AutosizeTextarea>
      </Content>
    )
  }
}

export default AttachmentObject
