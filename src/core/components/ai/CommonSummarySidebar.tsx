import { memo } from 'react'
import { IEditorAISummary, IMediaAiSummary, IPDFAiSummary } from '~/typings'
import { TabPane, Tabs } from '@/components'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { Icons } from '@/consts'
import { Tab } from '@/components/base/tabs'
import EditorAISummaryRenderer from '@/core/components/editor/components/AI/EditorAISummaryRenderer'
import PDFAISummaryRenderer from '@/core/components/pdf/components/sidebar/AI/PDFAISummaryRenderer'
import MediaAISummaryRenderer from '@/core/components/media/components/AI/MediaAISummaryRenderer'
import EditorAIOutlineRenderer from '@/core/components/editor/components/AI/EditorAIOutlineRenderer'
import PDFAIOutlineRenderer from '@/core/components/pdf/components/sidebar/AI/PDFAIOutlineRenderer'
import MediaAIOutlineRenderer from '@/core/components/media/components/AI/MediaAIOutlineRenderer'
import EditorMindmap from '@/core/components/editor/components/AI/EditorMindmap'
import PDFMindmap from '@/core/components/pdf/components/sidebar/AI/PDFMindmap'
import MediaMindmap from '@/core/components/media/components/AI/MediaMindmap'

export default memo(
  ({
    pdfSummary,
    mediaSummary,
    editorSummary
  }: {
    pdfSummary?: IPDFAiSummary
    mediaSummary?: IMediaAiSummary
    editorSummary?: IEditorAISummary
  }) => {
    const { t } = useTranslation()
    const size = 15
    return (
      <div className={'w-full h-full flex flex-col'}>
        <Tabs tabNavMode={'switch'} tabNavContainerClassname={'p-3'} tabNavClassname={'font-size-12'}>
          <TabPane tab={<Tab iconSize={size} icon={'custom-stars'} text={t(trans.AI.Summary)} />} key={'summary'}>
            {editorSummary && <EditorAISummaryRenderer />}
            {pdfSummary && <PDFAISummaryRenderer />}
            {mediaSummary && <MediaAISummaryRenderer summary={mediaSummary} />}
          </TabPane>
          <TabPane tab={<Tab iconSize={size} icon={'custom-list'} text={t(trans.AI.Outline)} />} key={'outline'}>
            {editorSummary && <EditorAIOutlineRenderer />}
            {pdfSummary && <PDFAIOutlineRenderer />}
            {mediaSummary && <MediaAIOutlineRenderer />}
          </TabPane>
          <TabPane tab={<Tab iconSize={size} icon={Icons.Mindmap} text={t(trans.AI.Mindmap)} />} key={'mindmap'}>
            {editorSummary && <EditorMindmap />}
            {pdfSummary && <PDFMindmap />}
            {mediaSummary && <MediaMindmap mindmap={mediaSummary.mindmap} />}
          </TabPane>
        </Tabs>
      </div>
    )
  }
)
