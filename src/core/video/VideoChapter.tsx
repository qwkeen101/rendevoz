import { Content } from "@/components";
import { css } from "@emotion/css";
import { memo, useEffect, useState } from "react";
import { IVideoChapter, XYPosition } from "~/typings";
import { captureVideoFrame } from "./utils";
import { useVideoInstance } from "./hooks/useVideoInstance";
import useThrottleFn from "@/hooks/utils/useThrottleFn";
import useVideoState from "./hooks/useVideoState";
import useVideoToolbarState from "./hooks/useVideoToolbarState";
import { useRafFn } from "@/hooks";

interface VideoChapterProps {
  percent: number;
  startTime: number;
  endTime: number;
  chapter?: IVideoChapter;
  idx: number;
}
const progressBgColor = "rgba(255,255,255,0.2)";
const previewProgressBgColor = "rgba(255,255,255,0.3)";
const loadProgessBgColor = "rgba(255,255,255,0.8)";
const hoverProgressBgColor = "rgba(255,255,255,0.5)";

const progressBarPadding = css({
  position: "absolute",
  width: "100%",
  height: 24,
  bottom: -8,
  zIndex: 30,
});
const progressList = css({
  background: progressBgColor,
  height: "100%",
  transform: "scaleY(0.6)",
  transition: "transform 0.3s ease",
});
const VideoChapter = memo(
  ({ percent, startTime, endTime, idx, chapter }: VideoChapterProps) => {
    const [chapterState, setChapterState] = useState<{
      thumbnailVisible: boolean;
      thumbnailPosition?: XYPosition;
      thumbnailUrl?: string;
      hovering?: boolean;
    }>({
      thumbnailVisible: false,
    });
    const instance = useVideoInstance();
    const { hovering } = chapterState;

    const [videoState, setVideoState] = useVideoState();
    const [toolbarState, setToolbarState] = useVideoToolbarState();
    const { progressbarHovering } = videoState;

    const {
      currentHoverTime = 0,
      currentScrubberTime = 0,
      draggingScrubber,
    } = toolbarState;
    const realHovering = draggingScrubber
      ? currentScrubberTime >= startTime && currentScrubberTime <= endTime
      : hovering;
    const realProgressBarHovering = progressbarHovering || draggingScrubber;
    const hoverPercent =
      currentHoverTime > endTime
        ? 1
        : currentHoverTime < startTime
        ? 0
        : (currentHoverTime - startTime) / (endTime - startTime);

    const { run: debounceGetThumbnail } = useThrottleFn(
      async () => {
        const videoEle = instance.getOffscreenVideo?.();
        if (videoEle) {
          const time = (endTime - startTime) * hoverPercent + startTime;
          const data = await captureVideoFrame(videoEle, time);
          setToolbarState((g) => ({ ...g, thumbnailUrl: data }));
        }
      },
      { wait: 200 }
    );

    const realLoadPercent =
      currentScrubberTime < startTime
        ? 0
        : currentScrubberTime > endTime
        ? 1
        : (currentScrubberTime - startTime) / (endTime - startTime);
    useEffect(() => {
      if (toolbarState.currentHoveringChapterIdx !== undefined) {
        const hoverIdx = toolbarState.currentHoveringChapterIdx;
        if (hoverIdx > idx) {
          setChapterState((s) => ({ ...s, hoverPercent: 1 }));
        } else if (hoverIdx < idx) {
          setChapterState((s) => ({ ...s, hoverPercent: 0 }));
        }
      }
    }, [toolbarState.currentHoveringChapterIdx]);

    const rafPointerMove = useRafFn((e) => {
      const markerBounding = instance
        .getMarkerContainer?.()
        ?.getBoundingClientRect();
      if (markerBounding) {
        const containerBounding = markerBounding;
        const { clientX } = e;
        debounceGetThumbnail();
        setChapterState((s) => ({
          ...s,
          hovering: true,
        }));
        setVideoState((s) => {
          if (s.progressbarHovering) {
            return s;
          } else {
            return { ...s, progressbarHovering: true };
          }
        });
        setToolbarState((s) => ({
          ...s,
          currentHoveringChapterIdx: idx,
          thumbnailPosition: {
            x: clientX,
            y: containerBounding.top,
          },
          thumbnailChapterName: chapter?.name,
          currentHoverTime:
            ((e.clientX - containerBounding.left) / containerBounding.width) *
            (videoState.totalTime || 0),
          thumbnailVisible: true,
        }));
      }
    });

    if (hovering) {
      if (
        draggingScrubber &&
        (currentScrubberTime > endTime || currentScrubberTime < startTime)
      ) {
        setChapterState((s) => ({ ...s, hovering: false }));
      }
      if (toolbarState.currentHoveringChapterIdx !== idx) {
        setChapterState((s) => ({ ...s, hovering: false }));
      }
    }
    return (
      <div
        data-chapter-idx={idx}
        onPointerLeave={(e) => {
          rafPointerMove.cancel();
          if (e.relatedTarget instanceof Element) {
            if (e.relatedTarget.closest("[data-video-pin=true]")) {
              const pinChapterIdx = e.relatedTarget.getAttribute(
                "data-pin-chapter-idx"
              );
              if (pinChapterIdx) {
                if (Number(pinChapterIdx) !== idx) {
                  setChapterState((s) => ({ ...s, hovering: false }));
                }
                return;
              } else {
                setChapterState((s) => ({ ...s, hovering: false }));
              }

              return;
            }
            if (e.relatedTarget.closest("[role='video-scrubber']")) {
              if (
                currentScrubberTime > startTime &&
                currentScrubberTime < endTime
              )
                return;
              else {
                setChapterState((s) => ({ ...s, hovering: false }));
              }
              return;
            }
            const closetChapter = e.relatedTarget.closest(
              `[data-chapter-idx='${idx}']`
            );
            if (
              closetChapter &&
              Number(closetChapter?.getAttribute("data-chapter-idx")) !== idx
            ) {
              setVideoState((s) => ({ ...s, progressbarHovering: false }));
              setChapterState((s) => ({ ...s, hovering: false }));
              setToolbarState((s) => ({ ...s, thumbnailVisible: false }));
              return;
            }
          }
          setToolbarState((s) => ({ ...s, thumbnailVisible: false }));
          setVideoState((s) => ({ ...s, progressbarHovering: false }));
          setChapterState((s) => ({ ...s, hovering: false }));
        }}
        onClick={() => {
          console.log("yes");
          const clickTime = hoverPercent * (endTime - startTime) + startTime;
          if (toolbarState.chooseTime) {
            setToolbarState((s) => ({ ...s, chosenTime: clickTime }));
          } else {
            instance.jumpTo?.(clickTime);
          }
        }}
        onPointerMove={rafPointerMove}
        style={{
          width: `${percent * 100}%`,
          height: "100%",
          transition: "all 0.2s ease",
          position: "relative",
          cursor: "pointer",
          transform: realHovering && percent !== 1 ? "scaleY(1.6)" : undefined,
        }}
      >
        <div className={progressBarPadding}></div>
        <Content
          className={progressList}
          style={{
            transform: realProgressBarHovering ? "none" : undefined,
          }}
        >
          <div
            className="load-progress"
            style={{
              transform: `scaleX(${realLoadPercent})`,
              background: loadProgessBgColor,
            }}
          ></div>
          <div
            className="hover-progress"
            style={{
              transform: `scaleX(${hoverPercent})`,
              background: hoverProgressBgColor,
              opacity: realProgressBarHovering ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          ></div>
        </Content>
      </div>
    );
  }
);

export default VideoChapter;
