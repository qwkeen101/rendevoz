import Colors from "@/consts/colors";
import useVideoState from "./hooks/useVideoState";
import { VideoToolbarStateAtom } from "./hooks/useVideoToolbarState";
import { motion } from "framer-motion";
import { useVideoInstance } from "./hooks/useVideoInstance";
import { memo, useRef, useState } from "react";
import { useSetAtom } from "jotai";
import useThrottleFn from "@/hooks/utils/useThrottleFn";
import { captureVideoFrame } from "./utils";

const VideoScrubber = memo(() => {
  const [videoState, setVideoState] = useVideoState();
  const setToolbarState = useSetAtom(VideoToolbarStateAtom);
  const instance = useVideoInstance();
  const { totalTime = 0 } = videoState;
  const scrubberRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { run: debounceGetThumbnail } = useThrottleFn(
    async (time: number) => {
      const videoEle = instance.getOffscreenVideo?.();
      if (videoEle) {
        const data = await captureVideoFrame(videoEle, time);
        setToolbarState((g) => ({ ...g, thumbnailUrl: data }));
      }
    },
    { wait: 200 }
  );

  const handleShowThumbnail = (e: PointerEvent) => {
    const markerBounding = instance
      .getMarkerContainer?.()
      ?.getBoundingClientRect();
    if (markerBounding) {
      const { clientX } = e;
      if (clientX >= markerBounding.right || clientX <= markerBounding.left)
        return;
      const x = Math.max(
        0,
        Math.min(markerBounding.left + markerBounding.width, clientX)
      );
      const currTime =
        ((x - markerBounding.left) / markerBounding.width) * totalTime;
      debounceGetThumbnail(currTime);
      const chapter = videoState.sortedChapters?.findLastIndex(
        (i) => i.startTime < currTime
      );
      setToolbarState((s) => ({
        ...s,
        currentHoveringChapterIdx: chapter,
        thumbnailPosition: {
          x,
          y: markerBounding.top,
        },
        thumbnailChapterName:
          chapter !== undefined
            ? videoState.sortedChapters?.[chapter]?.name
            : s.thumbnailChapterName,
        currentScrubberTime: currTime,
        currentHoverTime: currTime,
        thumbnailVisible: true,
      }));
    }
  };
  return (
    <div
      ref={containerRef}
      style={{
        left: 0,
        position: "absolute",
        top: -4,
        transition: "all 0.3s ease",
        width: "100%",
        opacity: videoState.progressbarHovering || isDragging ? 1 : 0,
        pointerEvents: "none",
        zIndex: 100,
      }}
      role="video-scrubber"
    >
      <motion.div
        ref={scrubberRef}
        drag="x"
        onPointerMove={handleShowThumbnail}
        style={{
          height: 13,
          cursor: "pointer",
          width: 13,
          background: Colors.Font.White,
          borderRadius: 999,
          pointerEvents: "auto",
          position: "absolute",
        }}
        whileHover={{
          scale: 1.2,
          x: isDragging ? undefined : "-50%",
        }}
        animate={{
          x: isDragging ? undefined : "-50%",
          left: `${((videoState.currentTime || 0) / totalTime) * 100}%`,
        }}
        transition={{
          x: {
            duration: 0,
          },
          left: {
            duration: 0,
          },
          scale: {
            duration: 0.2,
          },
        }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={(e) => {
          setIsDragging(true);
          setToolbarState((s) => ({ ...s, draggingScrubber: true }));
        }}
        onDragEnd={() => {
          setIsDragging(false);
          setToolbarState((s) => {
            setVideoState((b) => ({
              ...b,
              currentTime: s.currentScrubberTime,
            }));
            return { ...s, draggingScrubber: false, thumbnailVisible: false };
          });
        }}
        onDrag={(e, info) => {
          handleShowThumbnail(e as PointerEvent);
        }}
        dragConstraints={containerRef}
      ></motion.div>
    </div>
  );
});

export default VideoScrubber;
