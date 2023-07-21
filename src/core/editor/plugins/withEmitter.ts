import EventEmitter from "@/events/eventEmitter";
import { CustomEditor } from "../../../../typings/editor/types";

const withEmitter = (editor: CustomEditor, emitter: EventEmitter) => {
  editor.emitter = emitter;
  return editor;
};

export default withEmitter;
