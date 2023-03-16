import { IPdfViewer } from '@/pdfViewer/core/types/pdfViewer'
import { ILabel } from '~/typings/data'

export const ID_TO_LABEL_MAP = new WeakMap<
  IPdfViewer,
  Map<
    number,
    {
      focus: VoidFunction
    }
  >
>()
