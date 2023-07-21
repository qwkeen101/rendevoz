import { AnimatePresence, motion } from "framer-motion";
import { cloneElement, ReactElement, useEffect, useRef, useState } from "react";
import { AnimatePopover, Image, WithBorder } from "@/components";
import { GlobalDragOverlayInstance } from "./globalDragOverlay";

type PocketObject = {
  type: "image";
  url: string;
};
export let GlobalPocketInstance:
  | {
      getRect: () => DOMRect | undefined;
      addObject: (obj: PocketObject) => void;
    }
  | undefined = undefined;
const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    };
  },
};
const GlobalPocket = ({
  children,
}: {
  children: (urls: PocketObject[]) => ReactElement;
}) => {
  const [objects, setObjects] = useState<PocketObject[]>([]);
  const [pocketVisible, setPocketVisible] = useState(false);
  const [[currentViewIdx, direction], setCurrentViewIdx] = useState([0, 0]);
  const galleryRef = useRef<HTMLDivElement>();
  GlobalPocketInstance = {
    getRect: () => galleryRef.current?.getBoundingClientRect(),
    addObject: (obj) => setObjects((o) => [...o, obj]),
  };

  const renderChildren = () =>
    cloneElement(children(objects), {
      ref: (node) => (galleryRef.current = node),
    });

  useEffect(() => {
    const clickHandler = () => {
      setPocketVisible(!pocketVisible);
    };
    galleryRef.current?.addEventListener("click", clickHandler);
    return () => {
      galleryRef.current?.removeEventListener("click", clickHandler);
    };
  });
  const paginate = (dir: number) => {
    let newIdx = currentViewIdx + dir;
    if (newIdx >= objects.length) {
      newIdx = 0;
    }
    if (newIdx < 0) {
      newIdx = objects.length - 1;
    }
    setCurrentViewIdx([newIdx, dir]);
  };
  const renderContent = () => {
    return (
      <WithBorder
        style={{
          position: "relative",
          borderRadius: 8,
          padding: 12,
          overflow: "hidden",
          width: 280,
          height: 194,
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              onClick={() => paginate(1)}
              initial="enter"
              animate="center"
              exit="exit"
              key={currentViewIdx}
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              custom={direction}
              variants={variants}
              style={{
                borderRadius: 6,
                overflow: "hidden",
                position: "absolute",
                width: "100%",
              }}
            >
              <Image
                onDragStart={(e) => {
                  e.preventDefault();
                  GlobalDragOverlayInstance.draggingDetails = {
                    type: "image",
                    url: objects[currentViewIdx].url,
                  };
                  const dragEle = e.currentTarget.cloneNode(
                    true
                  ) as HTMLImageElement;
                  const bound = e.currentTarget.getBoundingClientRect();
                  dragEle.style.width = `${bound.width}px`;
                  dragEle.style.height = `${bound.height}px`;
                  GlobalDragOverlayInstance.addDragElements?.(dragEle);
                  GlobalDragOverlayInstance.startDrag?.();
                }}
                onDrag={(e) => {
                  e.preventDefault();
                }}
                draggable
                ratio={0.66}
                width="100%"
                src={objects[currentViewIdx]?.url}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </WithBorder>
    );
  };
  return (
    <AnimatePopover
      positions={["right"]}
      align="start"
      padding={20}
      containerStyle={{ zIndex: "10000" }}
      content={renderContent()}
      visible={pocketVisible}
    >
      <div>{renderChildren()}</div>
    </AnimatePopover>
  );
};

export default GlobalPocket;
