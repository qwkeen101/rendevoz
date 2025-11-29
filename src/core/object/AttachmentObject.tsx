import { CheckBox, Content, AutosizeTextarea } from '@/components'
import { IMetaAttachment } from '~/typings'
import { InlineObject } from '@/core'

const AttachmentObject = ({
  showSelect,
  onSelect,
  selected,
  attachment,
  onChange
}: {
  showSelect?: boolean
  onSelect?: (selected: boolean) => void
  selected?: boolean
  attachment: IMetaAttachment
  onChange: (att: IMetaAttachment) => void
}) => {
  if (attachment.type !== 'attachmentText') {
    const metaId = attachment.id
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
        <InlineObject
          id={metaId}
          onClick={
            showSelect
              ? () => {
                  onSelect?.(!selected)
                }
              : undefined
          }
        />
      </Content>
    )
  } else {
    return (
      <Content
        flex
        alignItems="center"
        gap={6}
        style={{ cursor: 'pointer' }}
        className={'transparent-font'}
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
          style={{ padding: 0, width: '100%', resize: 'none' }}
        ></AutosizeTextarea>
      </Content>
    )
  }
}

export default AttachmentObject
