import { Event } from "./eventEmitter";
import EventHandler from "./eventHandler";

type ZoomChangeEvent = {
  zoomLevel: number;
  zoomMultiplier: number;
};
type PanChangeEvent = {};
export interface WhiteboardEventMap {
  zoomChange: ZoomChangeEvent;
  panChange: PanChangeEvent;
}
export type WhiteboardEvent = Event<
  WhiteboardEventMap,
  keyof WhiteboardEventMap
>;
export class WhiteboardEventHandler extends EventHandler<WhiteboardEventMap> {}
