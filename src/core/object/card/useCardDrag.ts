import { GlobalDragOverlayInstance, useGlobalIsDragging } from "@/core";
import { useMemoizedFn } from "@/hooks";
import { MetaStore } from "@/stores";
import { RefObject, useEffect, useRef, useState } from "react";
import { MetaObject } from "~/typings/data";

const useCardDrag = (
  metaObject: MetaObject,
  draggableElementRef?: RefObject<HTMLElement>,
  showElement?: HTMLElement | null
) => {
  const [isGlobalDragging] = useGlobalIsDragging();
  const [isCardDraggingInside, setIsCardDraggingInside] = useState(false);
  const isPressed = useRef(false);
  const { addMetaLink, updateMetaObject } = MetaStore;
  const mouseDownHandler = (e: MouseEvent) => {
    const cloned = showElement?.cloneNode(true) as HTMLElement;
    cloned.style.width = `${showElement?.clientWidth}px`;
    cloned.style.height = `${showElement?.clientHeight}px`;
    if (cloned && GlobalDragOverlayInstance) {
      GlobalDragOverlayInstance.addDragElements?.(cloned);
      GlobalDragOverlayInstance.draggingDetails = {
        type: "metaElement",
        metaId: metaObject.id,
      };
    }
    isPressed.current = true;
  };

  const mouseMoveHandler = useMemoizedFn((e: MouseEvent) => {
    if (isPressed.current) {
      GlobalDragOverlayInstance.startDrag?.();
    }
  });
  const mouseUpHandler = () => {
    isPressed.current = false;
  };
  const showElementMouseHandler = (e: MouseEvent) => {
    if (isGlobalDragging) {
      if (e.type === "pointerenter") {
        if (
          GlobalDragOverlayInstance?.draggingDetails?.metaId !== metaObject.id
        ) {
          setIsCardDraggingInside(true);
        }
      }
      if (e.type === "pointerleave") {
        setIsCardDraggingInside(false);
      }
    }
  };
  useEffect(() => {
    if (!isGlobalDragging) {
      isPressed.current = false;
      if (isCardDraggingInside) {
        const draggingEle = GlobalDragOverlayInstance?.draggingDetails;
        GlobalDragOverlayInstance.draggingDetails = undefined;
        if (draggingEle && draggingEle.type === "metaElement") {
          addMetaLink({
            sourceId: draggingEle.metaId,
            targetId: metaObject.id,
          });
        }
        if (draggingEle && draggingEle.type === "image") {
          updateMetaObject({
            id: metaObject.id,
            coverImgSrc: draggingEle.url,
          });
        }
        setIsCardDraggingInside(false);
      }
    }
  }, [isGlobalDragging]);

  useEffect(() => {
    const draggableElement = draggableElementRef?.current;
    if (draggableElement) {
      draggableElement?.addEventListener("pointerdown", mouseDownHandler);
      draggableElement?.addEventListener("pointermove", mouseMoveHandler);
      showElement?.addEventListener("pointerenter", showElementMouseHandler);
      showElement?.addEventListener("pointerleave", showElementMouseHandler);
      document.addEventListener("pointerup", mouseUpHandler);
      return () => {
        draggableElement?.removeEventListener("pointerdown", mouseDownHandler);
        draggableElement?.removeEventListener("pointermove", mouseMoveHandler);
        showElement?.removeEventListener(
          "pointerenter",
          showElementMouseHandler
        );
        showElement?.removeEventListener(
          "pointerleave",
          showElementMouseHandler
        );
        document.removeEventListener("pointerup", mouseUpHandler);
      };
    }
  });
  return {
    isCardDraggingInside,
  };
};

export default useCardDrag;
