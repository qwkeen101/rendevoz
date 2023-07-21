import { atom, useAtomValue, useSetAtom } from "jotai";
import { IVideoInstance } from "~/typings";
import { captureVideoFrame, captureVideoFrameBlob } from "../utils";
import { saveImageLocally } from "@/utils/img";
import { ObjectStore } from "@/stores";
import { RefObject } from "react";
import { assignProperties } from "@/utils";
import { VideoStateAtom } from "./useVideoState";
import { VideoToolbarStateAtom } from "./useVideoToolbarState";
import Id from "@/utils/id";

export const VideoInstanceAtom = atom<Partial<IVideoInstance>>({});

export const useAssignVideoInstance = (
  videoId: number,
  containerRef: RefObject<HTMLElement>
) => {
  const videoInstance = useVideoInstance();
  const videoState = useAtomValue(VideoStateAtom);
  const setToolbarState = useSetAtom(VideoToolbarStateAtom);

  assignProperties(videoInstance, {
    getVideoId: () => videoId,
    getVideoState: () => videoState,
    captureImage: async (time, size) => {
      const offscreenVideo = videoInstance.getOffscreenVideo?.();
      if (offscreenVideo) {
        return await captureVideoFrame(offscreenVideo, time, size);
      }
    },
    insertChapter: async (chapter) => {
      if (!chapter.startTime) return;
      const video = await ObjectStore("video").getOneById(videoId);
      const offscreenVideo = videoInstance.getOffscreenVideo?.();
      if (video && offscreenVideo) {
        const chapters = video.chapters || [];
        if (chapters.length === 0) {
          const img = await captureVideoFrameBlob(offscreenVideo, 0);
          const imgPath = await saveImageLocally(img, { compress: false });
          chapters.push({
            startTime: 0,
            name: "Untitled Chapter",
            id: Id.getId(),
            imageUrl: imgPath,
          });
        }
        const img = await captureVideoFrameBlob(
          offscreenVideo,
          chapter.startTime
        );
        const imgPath = await saveImageLocally(img, { compress: false });
        await ObjectStore("video").updateOne({
          id: videoId,
          chapters: [
            ...chapters,
            {
              ...chapter,
              startTime: chapter.startTime!,
              name: chapter.name || "Untitled Chapter",
              id: chapter.id || Id.getId(),
              imageUrl: imgPath,
            },
          ],
        });
      }
    },
    deleteChapter: async (id) => {
      const video = await ObjectStore("video").getOneById(videoId);
      if (video) {
        let chapters = video.chapters || [];
        chapters = chapters.filter((i) => i.id !== id);
        await ObjectStore("video").updateOne({ id: videoId, chapters });
      }
    },
    insertChapters: async (chapters) => {
      const video = await ObjectStore("video").getOneById(videoId);
      if (video) {
        const _chapters = video.chapters || [];
        await ObjectStore("video").updateOne({
          id: videoId,
          chapters: [..._chapters, ...chapters],
        });
      }
    },
    updateChapter: async (chapter) => {
      const video = await ObjectStore("video").getOneById(videoId);
      if (video) {
        const chapters = video.chapters;
        if (chapters?.length) {
          const originChapter = chapters.find((i) => i.id === chapter.id);
          const newChapters = chapters.filter((i) => i.id !== chapter.id);
          const newChapter = Object.assign({}, originChapter, chapter);
          await ObjectStore("video").updateOne({
            id: videoId,
            chapters: [...newChapters, newChapter],
          });
        }
      }
    },
    insertLabel: async (label) => {
      const time = label.videoTime;
      const ele = videoInstance.getOffscreenVideo?.();
      if (!time || !ele) return Promise.reject();
      const img = await captureVideoFrameBlob(ele, time);
      const imgPath = await saveImageLocally(img, { compress: false });
      const one = await ObjectStore("videoLabel").addOne({
        ...label,
        imageUrl: imgPath,
        parentObjectId: videoId,
      });
      const video = await ObjectStore("video").getOneById(videoId);
      if (video) {
        const labels = video.labels || [];
        await ObjectStore("video").updateOne({
          id: videoId,
          labels: [...labels, one.id],
        });
      }
      return one;
    },
    getMarkerContainer: () => {
      return containerRef.current?.querySelector(
        "[role='video-process-marker']"
      );
    },
    getPlayerElement: () => containerRef.current,
    closeThumbnail: () => {
      setToolbarState((s) => ({
        ...s,
        thumbnailVisible: false,
        currentHoverLabelId: undefined,
      }));
    },
    openThumbnailAtTime: async (time, opts) => {
      const marker = videoInstance.getMarkerContainer?.();
      const ele = videoInstance.getOffscreenVideo?.();
      if (!marker || !videoState.totalTime || !ele) return;
      const markerBounding = marker.getBoundingClientRect();
      const x =
        (time / videoState.totalTime) * markerBounding.width +
        markerBounding.left;
      const chapter = videoState.sortedChapters?.findLast(
        (i) => i.startTime < time
      );
      const img = await captureVideoFrame(ele, time);
      setToolbarState((s) => ({
        ...s,
        thumbnailVisible: true,
        thumbnailChapterName: chapter?.name,
        thumbnailPosition: {
          x,
          y: markerBounding.top,
        },
        thumbnailUrl: img,
        thumbnailLabelName: opts?.labelName,
        currentHoverLabelId: opts?.labelId,
        currentHoverTime: time,
      }));
    },
    deleteLabel: async (id) => {
      await ObjectStore("videoLabel").deleteOneById(id);
      const video = await ObjectStore("video").getOneById(videoId);
      if (video) {
        await ObjectStore("video").updateOne({
          id: videoId,
          labels: video.labels?.filter((i) => i !== id),
        });
      }
    },
  });
};
export const useVideoInstance = () => useAtomValue(VideoInstanceAtom);
