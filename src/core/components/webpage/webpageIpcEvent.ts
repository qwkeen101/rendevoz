export type IpcWebpageEvent =
  | {
      eventType: "click";
      x: number;
      y: number;
      bodyX: number;
      bodyY: number;
      imgSrc?: string;
    }
  | {
      eventType: "contextmenu";
      x: number;
      y: number;
      bodyX: number;
      bodyY: number;
    }
  | {
      eventType: "dragstart";
      data: string[][];
    }
  | {
      eventType: "drop";
    }
  | {
      eventType: "keydown";
      altKey: boolean;
      ctrlKey: boolean;
      metaKey: boolean;
      shiftKey: boolean;
      key: string;
      code: string;
    };
