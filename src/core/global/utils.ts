import { XYPosition } from "~/typings";

export const getPanelPosition = (options: {
  pos?: XYPosition;
  e?: PointerEvent | MouseEvent;
  defaultSize: { width: number; height: number };
  placement?: "top" | "right" | "bottom" | "left";
}) => {
  let pos: XYPosition | null = null;
  const place = options.placement || "top";
  // disable change position when panel is visible
  if (options.e || options.pos) {
    if (options.pos) pos = options.pos;
    if (options.e) {
      const listener = options.e.currentTarget;
      const bounding =
        listener instanceof HTMLElement
          ? listener.getBoundingClientRect()
          : undefined;
      const { clientX, clientY } = options.e;
      if (place === "top") {
        pos = {
          x:
            (bounding ? bounding.left + bounding.width / 2 : clientX) -
            options.defaultSize.width / 2,
          y: bounding ? bounding.top + bounding.height + 20 : clientY + 20,
        };
      }
      if (place === "right") {
        pos = {
          x: (bounding ? bounding.left + bounding.width : clientX) + 20,
          y: bounding
            ? bounding.top + bounding.height / 2
            : clientY - options.defaultSize.height / 2,
        };
      }
    }
  }
  if (pos) {
    pos.x = Math.max(
      Math.min(pos.x, window.innerWidth - options.defaultSize.width),
      40
    );
    pos.y = Math.max(
      Math.min(pos.y, window.innerHeight - options.defaultSize.height),
      40
    );
  }
  console.log(pos);
  return pos;
};
