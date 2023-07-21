import { Content } from "@/components";
import TabTitle from "@/components/layout/TabTitle";
import { Video, VideoProps } from "@/core";
import { Rendevoz } from "@/core/rendevoz";
import { MetaStore } from "@/stores";

const VideoPage = (props: VideoProps) => {
  const video = MetaStore.getMetaObjectByObjectId(props.videoId);
  return (
    <Content fullWidth fullHeight>
      <TabTitle
        title={video?.name || "Unnamed Video"}
        icon={Rendevoz.Utils.Object.getMetaObjectIcon("video")}
      />
      <Video {...props} />
    </Content>
  );
};

export default VideoPage;
