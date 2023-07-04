export declare function videoToAudio(videoFileData: Blob | File, targetAudioFormat?: string): Promise<{
    format: string;
    data: string;
}> | undefined;
