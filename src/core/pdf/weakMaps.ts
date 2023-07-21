import { IPdfViewer } from "~/typings";

export const ID_TO_LABEL_MAP = new WeakMap<
  IPdfViewer,
  Map<
    number,
    {
      focus: VoidFunction;
    }
  >
>();
