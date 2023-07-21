import { Button, Content, Icon } from "@/components";
import { atom, useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import useGraph from "../hooks/useGraph";
import { SimpleObject } from "@/core/global";
import Colors from "@/consts/colors";

export const GraphPathFilterAtom = atom<
  | {
      startNodeId?: number;
      endNodeId?: number;
      tempEndNodeId?: number;
      allPaths?: number[][];
      visiblePath?: number[][];
      filteredNodeIds?: Set<number>;
      filteredLinkIds?: Set<number>;
      maxPathLength?: number;
      showShortest?: boolean;
    }
  | undefined
>(undefined);

const GraphPathFilter = () => {
  const [pathFilter, setPathFilter] = useAtom(GraphPathFilterAtom);
  const graph = useGraph();
  const { t } = useTranslation();

  return (
    <Content
      flex
      column
      gap={6}
      style={{ width: 280, borderRadius: 12, padding: 12 }}
    >
      {pathFilter?.startNodeId ? (
        <>
          <div>{t("graph.path start node")}</div>
          <SimpleObject
            showIcon
            iconName="park-close"
            metaObjectId={pathFilter.startNodeId}
            onIconClick={() => {
              setPathFilter((f) => ({ ...f, startNodeId: undefined }));
            }}
          />
        </>
      ) : (
        <Button.IconButton
          text={t("graph.choose start node on graph")}
          onClick={() => {
            if (graph) {
              graph.isChoosingNode = "start";
            }
          }}
        />
      )}

      {pathFilter?.endNodeId ? (
        <>
          <div>{t("graph.path end node")}</div>
          <SimpleObject
            showIcon
            iconName="park-close"
            metaObjectId={pathFilter.endNodeId}
            onIconClick={() => {
              setPathFilter((f) => ({ ...f, endNodeId: undefined }));
            }}
          />
        </>
      ) : (
        <Button.IconButton
          text={t("graph.choose end node on graph")}
          onClick={() => {
            if (graph) {
              graph.isChoosingNode = "end";
            }
          }}
        />
      )}
      {pathFilter?.startNodeId &&
        pathFilter.endNodeId &&
        pathFilter.visiblePath &&
        (pathFilter.visiblePath?.length > 0 ? (
          <div>
            {t("graph.total paths")}: {pathFilter?.visiblePath?.length}
          </div>
        ) : (
          <Content
            flex
            gap={10}
            alignItems="center"
            style={{ fontWeight: 700 }}
          >
            <Icon name="park-close" fill={"#E76161"} theme="filled" />
            {t("graph.no path found")}
          </Content>
        ))}
      <Content flex column gap={3}>
        <Button.IconButton
          icon="park-switch"
          text={t("graph.switch start and end nodes")}
          onClick={() =>
            setPathFilter((f) => ({
              ...f,
              startNodeId: f?.endNodeId,
              endNodeId: f?.startNodeId,
            }))
          }
        />
        <Button.IconButton
          icon="park-clear"
          text={t("graph.clear paths")}
          onClick={() => {
            setPathFilter(undefined);
            if (graph) {
              graph.isChoosingNode = false;
            }
          }}
        />
        <Button.IconButton
          icon="park-connection"
          text={
            pathFilter?.showShortest
              ? t("graph.show all paths")
              : t("graph.show shortest path")
          }
          onClick={() => {
            setPathFilter((f) => ({ ...f, showShortest: !f?.showShortest }));
          }}
        />
        <Content flex alignItems="center" justifyContent="space-between">
          <div>{t("graph.max path length")}</div>
          <input
            placeholder="∞"
            value={pathFilter?.maxPathLength || "∞"}
            onChange={(e) => {
              const length = parseInt(e.target.value.replace(/\D/g, "") || "0");

              if (length >= 0) {
                setPathFilter((f) => ({ ...f, maxPathLength: length }));
              }
            }}
            style={{
              width: 30,
              border: "none",
              borderBottom: `1px solid ${Colors.Background.Border}`,
              outline: "none",
              background: "transparent",
              textAlign: "center",
            }}
          />
        </Content>
      </Content>
    </Content>
  );
};

export default GraphPathFilter;
