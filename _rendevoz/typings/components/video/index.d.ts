import { PartialWithId } from "@/types";
import { IVideoChapter, IVideoLabel } from "../data";
import { VideoState } from "@/core/video/hooks/useVideoState";
import { Size } from "../common";

export type IVideoInstance = Partial<{
  play: VoidFunction;
  pause: VoidFunction;
  // second
  jumpTo: (time: number) => void;
  mute: VoidFunction;
  unmute: VoidFunction;
  loop: VoidFunction;
  unloop: VoidFunction;
  getUrl: () => string | undefined;
  getVideoId: () => number;
  getVideoElement: () => HTMLVideoElement | undefined;
  getPlayerElement: () => HTMLElement | undefined | null;
  getOffscreenVideo: () => HTMLVideoElement | undefined;
  getVideoState: () => VideoState;
  openThumbnailAtTime: (
    time: number,
    options?: {
      labelName?: string;
      labelId?: number;
    }
  ) => void;
  closeThumbnail: VoidFunction;
  insertChapter: (chapter: Partial<IVideoChapter>) => Promise<void>;
  insertChapters: (chapters: IVideoChapter[]) => Promise<void>;
  deleteChapter: (chapterId: number) => Promise<void>;
  updateChapter: (newChapter: PartialWithId<IVideoChapter>) => Promise<void>;
  insertLabel: (label: Partial<IVideoLabel>) => Promise<IVideoLabel>;
  deleteLabel: (labelId: number) => Promise<void>;
  getMarkerContainer: () => HTMLElement | undefined | null;
  captureImage: (time: number, size?: Size) => Promise<string | undefined>;
}>;
