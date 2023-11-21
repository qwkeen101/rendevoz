import { useRef, useState } from "react";
import { AnimatePopover, Content, Footer, Icon } from "../../base";
import Webpage from "@/core/components/webpage/Webpage";
import FontSize from "@/consts/font";
import { Zindexes } from "@/consts";
import { useTranslation } from "react-i18next";
import { fetchRemoteImageAndSaveLocally } from "@/utils/img";
import { getSetting } from "@/core";
import ClassName from "@/styles/classNames";

const FormWebImagePicker = ({
  onPick,
  name = "",
}: {
  onPick: (url: string) => void;
  name: string;
}) => {
  const [chooseState, setChooseState] = useState<{
    left?: number;
    top?: number;
    visible: boolean;
    currentImageSrc?: string;
  }>({ visible: false });
  const containerRef = useRef<HTMLElement>();
  const { left, top, visible, currentImageSrc } = chooseState;
  const { t } = useTranslation();
  const getSearchEngineUrl = (query: string) => {
    const normalized = query.trim();
    const setting = getSetting();
    switch (setting.general.defaultImageSearchEngine) {
      case "bing": {
        return `https://bing.com/images/search?q=${query.replaceAll(" ", "+")}`;
      }
      case "pinterest": {
        return `https://www.pinterest.com/search/pins/?q=${normalized}`;
      }
      case "baidu": {
        return `https://image.baidu.com/search/index?tn=baiduimage&word=${normalized.replaceAll(
          " ",
          "+"
        )}`;
      }
      case "google": {
        return `https://www.google.com/search?q=${normalized.replaceAll(
          " ",
          "+"
        )}&tbm=isch`;
      }
      default: {
        return `https://bing.com/images/search?q=${query.replaceAll(" ", "+")}`;
      }
    }
  };
  return (
    <Content
      flex
      column
      style={{
        width: "80vw",
        height: "90vh",
        padding: "10px 12px",
        borderRadius: 16,
      }}
      className={ClassName.Background.pseudoBlurContrastBackground}
      ref={containerRef}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          fontSize: FontSize["16px"],
        }}
      >
        {t("general.pick image from internet")}
      </div>
      <AnimatePopover
        containerStyle={{ zIndex: String(Zindexes.Tooltip) }}
        position={{ left, top }}
        visible={visible}
        disableIntersection
        boundaryInset={20}
        reposition
        positions={["right", "left"]}
        align="start"
        padding={10}
        content={
          <Content flex column style={{ padding: "12px 18px" }} gap={10}>
            <div style={{ fontWeight: 700, lineHeight: 1 }}>
              {t("general.choose this image")}?
            </div>
            <img
              src={currentImageSrc}
              style={{
                maxWidth: 280,
                minWidth: 200,
                maxHeight: 300,
                borderRadius: 8,
                objectFit: "cover",
              }}
            />
            <Footer
              onSubmit={() => {
                if (currentImageSrc) {
                  fetchRemoteImageAndSaveLocally(currentImageSrc).then(
                    (path) => {
                      onPick?.(path);
                    }
                  );
                }
                setChooseState((s) => ({ ...s, visible: false }));
              }}
              onBack={() => setChooseState((s) => ({ ...s, visible: false }))}
            ></Footer>
          </Content>
        }
      ></AnimatePopover>
      <Content
        flex
        gap={12}
        alignItems="center"
        className={ClassName.description()}
        style={{
          position: "absolute",
          top: 10,
          right: 100,
        }}
      >
        <Icon name="park-info" />
        <div>{t("general.click to pick image")}</div>
      </Content>
      <div style={{ width: "100%", height: 0, flex: 1 }}>
        <Webpage
          navigationState={{
            showAddAsObject: false,
            showReaderMode: false,
          }}
          disableImageClick
          navigationStyle={{
            padding: "6px 0px",
            fontSize: FontSize["14px"],
          }}
          onEvent={(event) => {
            if (event.eventType === "click") {
              if (event.imgSrc) {
                setChooseState((s) => ({
                  ...s,
                  visible: true,
                  left: event.bodyX,
                  top: event.bodyY,
                  currentImageSrc: event.imgSrc,
                }));
              } else {
                setChooseState((s) => ({ ...s, visible: false }));
              }
            }
          }}
          initialUrl={getSearchEngineUrl(name)}
        />
      </div>
    </Content>
  );
};

export default FormWebImagePicker;
