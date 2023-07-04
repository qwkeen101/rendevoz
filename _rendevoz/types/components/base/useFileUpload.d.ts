/// <reference types="react" />
declare const useFileUpload: (onUpload?: (file: File) => void, accept?: string, options?: {
    multiple?: boolean;
}) => {
    renderUploader: () => JSX.Element;
    upload: () => void;
    removeFile: () => void;
};
export default useFileUpload;
