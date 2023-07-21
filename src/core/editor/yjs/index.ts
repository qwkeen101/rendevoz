import { RelativeRange } from "./model/types";
import {
  withYHistory,
  WithYHistoryOptions,
  withYjs,
  WithYjsOptions,
  YHistoryEditor,
  YjsEditor,
} from "./plugins";
import { slateNodesToInsertDelta, yTextToSlateElement } from "./utils/convert";
import {
  relativePositionToSlatePoint,
  relativeRangeToSlateRange,
  slatePointToRelativePosition,
  slateRangeToRelativeRange,
} from "./utils/position";

export {
  withYjs,
  YjsEditor,
  // History plugin
  withYHistory,
  YHistoryEditor,
  yTextToSlateElement,
  slateNodesToInsertDelta,
  slateRangeToRelativeRange,
  relativeRangeToSlateRange,
  slatePointToRelativePosition,
  relativePositionToSlatePoint,
};
export type {
  WithYjsOptions,
  WithYHistoryOptions,
  // Base cursor plugin
  // CursorEditor,
  // WithCursorsOptions,
  // withCursors,
  // CursorState,
  // RemoteCursorChangeEventListener,
  // CursorStateChangeEvent,
  // Utils
  RelativeRange,
};
