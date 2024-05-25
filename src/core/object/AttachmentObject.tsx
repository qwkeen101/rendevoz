import { CheckBox, Content } from '@/components'
import useRenderObject from './renderer/useRenderObject'
import FontSize from '@/consts/font'
import { IMetaAttachment } from '~/typings'
import ClassName from '@/styles/classNames'
import AutosizeTextarea from '@/components/custom/input/AutoSizeTextArea'

const AttachmentObject = ({
  showSelect,
  onSelect,
  selected,
  attachment,
  renderAttOnParent,
  renderObjectDetailsOnParent = true,
  onChange
}: {
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
        className={'transparent-font font-size-12'}
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
