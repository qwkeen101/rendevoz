import { Descendant } from "slate";

export type IEditorEvent =
  | {
      type: "valueChange";
      value: Descendant[];
    }
  | {
      type: "click";
    }
  | {
      type: "titleChange";
      value: string;
    }
  | {
      type: "highlight";
      highlightId: number;
      labelId: number;
    }
  | {
      type: "highlightDrag";
      highlightId: number;
    }
  | {
      type: "highlightRemove";
      highlightId: number;
    }
  | {
      type: "translate";
      translatedText: string;
      blockId: number;
      e: React.MouseEvent;
    }
  | {
      type: "search";
      searchedText: string;
      blockId: number;
      e: React.MouseEvent;
    }
  | {
      type: "linkClick";
      link?: string;
      e: React.MouseEvent;
    }
  | {
      type: "contentRetrieved";
    };
