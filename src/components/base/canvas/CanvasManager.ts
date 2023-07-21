import Konva from "konva";
import { KonvaEventListener } from "konva/lib/Node";
import { Stage } from "konva/lib/Stage";
import { throttle } from "lodash";
import CustomLine from "./CustomLine";
import FreeDrawingManager from "./FreeDrawingManager";
import NodeManager from "./NodeManager";

class CanvasManager {
  private drawPoint = {
    points: [],
    begin: undefined,
  };
  private stage?: Konva.Stage;
  private layer?: Konva.Layer;
  private isPressed = false;
  public isErasing = false;
  private lastLine?: CustomLine;
  public freeDrawingManager = new FreeDrawingManager();
  public mode: "draw" | "move" | "shape" = "draw";
  public nodeManager = new NodeManager();
  public setMode = (mode: "draw" | "move" | "shape") => {
    this.mode = mode;
    if (mode === "move") {
      this.stage?.draggable(true);
    } else {
      this.stage?.draggable(false);
    }
  };

  public setDrawMode = (mode: "erase" | "draw") => {
    const freeDrawingCtx = this.freeDrawingManager.drawCanvas?.getContext("2d");
    if (freeDrawingCtx) {
      if (mode === "draw") {
        this.freeDrawingManager.isDrawing = true;
        freeDrawingCtx.globalCompositeOperation = "source-over";
      } else {
        this.freeDrawingManager.isDrawing = false;
        freeDrawingCtx.globalCompositeOperation = "destination-out";
      }
    }
  };
  public setEraserSize = (size: number) => {
    this.freeDrawingManager.eraserSize = size;
  };
  public setPencilSize = (size: number) => {
    this.freeDrawingManager.pencilSize = size;
  };
  public setPencilColor = (color: string) => {
    const ctx = this.freeDrawingManager.drawCanvas?.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = color;
    }
  };
  public addImage = (imageUrl: string) => {
    if (!this.stage) return;
    const image = new Image();
    image.src = imageUrl;
    image.onload = () => {
      const { width, height } = image;

      const stageWidth = this.stage?.width();
      const stageHeight = this.stage?.height();
      if (!stageHeight || !stageWidth) return;
      const maxWidth = stageWidth * 0.8;

      const realWidth = Math.min(maxWidth, width);
      const widthRatio = realWidth / width;
      const realHeight = height * widthRatio;
      const x = stageWidth / 2 - realWidth / 2;
      const y = stageHeight / 2 - realHeight / 2;

      const konvaImage = new Konva.Image({
        image,
        x,
        y,
        width: realWidth,
        height: realHeight,
      });
      this.layer?.add(konvaImage);
      konvaImage.zIndex(0);
    };
  };
  drawLineStart = (x: number, y: number) => {};
  drawLine = throttle((x: number, y: number) => {
    this.lastLine?.appendPoint(x, y);
  }, 16);
  pointerDownHandler: KonvaEventListener<Stage, PointerEvent> = (e) => {
    this.isPressed = true;
    const pos = getRelativePointerPosition(this.stage);
    this.freeDrawingManager.startPaint(pos);
    // const customLine = new CustomLine(pos?.x, pos?.y, this.isErasing ? 'erase' : 'paint')
    // this.layer?.add(customLine)
    // this.lastLine = customLine
  };
  private getPattern = (img) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 100;
    canvas.height = 100;
    if (ctx) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 100, 100);
      ctx.drawImage(img, 0, 0, 100, 100);
    }
    return ctx?.createPattern(canvas, "repeat");
  };
  pointerMoveHandler: KonvaEventListener<Stage, PointerEvent> = (e) => {
    if (this.isPressed) {
      if (this.mode === "draw") {
        const pos = getRelativePointerPosition(this.stage);
        this.freeDrawingManager.paint(pos);
      }
      // this.drawLine(pos?.x, pos?.y)
    }
  };
  pointerUpHandler: KonvaEventListener<Stage, PointerEvent> = (e) => {
    this.isPressed = false;
    this.freeDrawingManager.endPaint();
  };

  scaleHandler: KonvaEventListener<Stage, WheelEvent> = (e) => {
    e.evt.preventDefault();
    if (this.stage) {
      const stage = this.stage;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const mousePointTo = {
          x: (pointer.x - stage.x()) / oldScale,
          y: (pointer.y - stage.y()) / oldScale,
        };
        const direction = e.evt.deltaY < 0 ? 1 : -1;
        const newScale = direction > 0 ? oldScale * 1.05 : oldScale / 1.05;
        stage.scale({ x: newScale, y: newScale });
        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };
        stage.position(newPos);
      }
    }
  };
  public initialize = (container: HTMLDivElement) => {
    const containerBounding = container.getBoundingClientRect();

    const stage = new Konva.Stage({
      container: container,
      width: containerBounding.width,
      height: containerBounding.height,
    });
    stage.on("pointerdown", this.pointerDownHandler);
    stage.on("pointermove", this.pointerMoveHandler);
    stage.on("pointerup", this.pointerUpHandler);
    stage.on("wheel", this.scaleHandler);
    this.stage = stage;
    const layer = new Konva.Layer();
    this.layer = layer;
    this.stage.add(this.layer);
    const canvas = document.createElement("canvas");
    canvas.width = stage.width();
    canvas.height = stage.height();
    this.freeDrawingManager.drawCanvas = canvas;
    this.freeDrawingManager.layer = layer;
    const image = new Konva.Image({
      image: canvas,
      x: 0,
      y: 0,
    });
    layer.add(image);
    image.zIndex(0);
    const ctx = canvas.getContext("2d");
    this.nodeManager.stage = stage;
    this.nodeManager.layer = layer;
    if (ctx) {
      ctx.strokeStyle = "black";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2;
    }
    return this.layer;
  };
  public destory = () => {
    this.stage?.destroy();
  };
}
function getRelativePointerPosition(node) {
  // the function will return pointer position relative to the passed node
  const transform = node.getAbsoluteTransform().copy();
  // to detect relative position we need to invert transform
  transform.invert();

  // get pointer (say mouse or touch) position
  const pos = node.getStage().getPointerPosition();

  // now we find relative point
  return transform.point(pos);
}
export default CanvasManager;
