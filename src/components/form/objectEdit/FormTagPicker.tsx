import { AnimatePopover, WithBorder } from '../../index'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import Tag from '@/core/object/ObjectTag'

const FormTagPicker = ({ tags = [], onChange }: { onChange?: (tags: number[]) => void; tags?: number[] }) => {
  const { t } = useTranslation()
  return (
    <div>
      <div className={'font-size-12 transparent-font mb-2'}>{t(trans.Tags)}</div>
      <AnimatePopover
        align={'start'}
        padding={6}
        positions={['bottom', 'top']}
        content={
          <WithBorder>
            <MetaTagPicker onChange={onChange} alreadyTags={tags} />
          </WithBorder>
        }
      >
        <div
          style={{
            '--placeholder': `"${t('general.Select tags')}"`
          }}
          className={
            'py-2 px-2 light-hover transition-colors empty-placeholder after:ml-1 flex flex-wrap gap-2 h-10 items-center font-size-13 cursor-pointer rounded-lg bg-input'
          }
        >
          {tags.map(i => (
            <Tag tag={i} square small />
          ))}
        </div>
      </AnimatePopover>
    </div>
  )
}

export default FormTagPicker
