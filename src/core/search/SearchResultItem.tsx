import { Content, Icon, Image } from "@/components";
import { globalStore, MetaStore } from "@/api/stores";
import { metaObjectsAtom } from "@/api/stores/meta.store";
import { Fragment, memo } from "react";
import { useRenderObject } from "../object";
import { GlobalSearchInputAtom, SearchGroup } from "./SearchDialog";

import ClassName from "@/styles/classNames";
import { useGlobalAtomValue, useToggle } from "@/hooks";
import Colors from "@/consts/colors";
import { css } from "@emotion/css";
import { useTranslation } from "react-i18next";
import FontSize from "@/consts/font";
import { DefaultObjectTitleRenderClazzName } from "../object/useRenderObject";
import { Zindexes } from "@/consts";
import { Rendevoz } from "../rendevoz";

const SearchResultItem = ({
  group,
  onNavi,
}: {
  group: SearchGroup;
  onNavi: VoidFunction;
}) => {
  const metaId = group.metaId;
  const [showChildren, toggleShowChildren] = useToggle(false);
  const { t } = useTranslation();
  const meta = MetaStore.useValue(metaId);
  return (
    <Content
      flex
      column
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      className={css({
        "*": {
          textTransform: "none !important",
        },
        ":not(:last-child)": {
          borderBottom: `1px solid ${Colors.Background.Border}`,
        },
        padding: "14px 0px",
      })}
    >
      {metaId && (
        <Content
          flex
          alignItems="center"
          gap={20}
          justifyContent="space-between"
        >
          {group.items.length > 0 && (
            <Icon
              containerStyle={{
                position: "absolute",
                left: -30,
                top: "50%",
                transform: "translateY(-50%)",
              }}
              style={{
                transform: showChildren ? "rotate(90deg)" : undefined,
                transition: "transform 0.3s ease",
              }}
              className={ClassName.circleButton()}
              name="park-right"
              onClick={toggleShowChildren}
            />
          )}
          <Content flex column style={{ zIndex: 9999 }} auto gap={3}>
            <SearchDetails
              highlightName={group.highlightName}
              metaId={metaId}
              onNavi={onNavi}
            />
            {!showChildren && group.items.length > 0 && (
              <div className={ClassName.description(FontSize["13px"])}>
                {group.items.length} {t("general.results")}
              </div>
            )}
            {!showChildren &&
              (group.highlightDescription || group.items[0]?.content) && (
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      group.highlightDescription || group.items[0].content,
                  }}
                  className={css([
                    ClassName.description("1rem"),
                    ClassName.ellipsisFont(3),
                  ])}
                ></div>
              )}
          </Content>
          {meta?.coverImgSrc && !showChildren && (
            <Image
              preview
              src={meta.coverImgSrc}
              width={200}
              ratio={0.5625}
              containerStyle={{ borderRadius: 10 }}
            />
          )}
        </Content>
      )}
      {metaId && showChildren && (
        <ol
          style={{
            listStyle: "none",
            marginBottom: 0,
            paddingLeft: 0,
            borderLeft: `1px solid ${Colors.Background.HighContrast}`,
          }}
          className={css({
            counterReset: "my-counter",
            li: {
              display: "flex",
              counterIncrement: "my-counter",
              "::before": {
                content: 'counter(my-counter) "."',
                marginRight: 10,
              },
            },
            "> *": {
              ":not(:last-child)": {
                borderBottom: `1px solid ${Colors.Background.Border}`,
              },
            },
          })}
        >
          {group.items.map((i) => (
            <Fragment key={i.id}>
              {i.specType === "pdfPage" && (
                <PdfSearchResult item={i} onNavi={onNavi} />
              )}
              {i.specType === "noteBlock" && (
                <NoteSearchResult
                  item={i}
                  onClick={() => {
                    onNavi();
                    if (metaId) {
                      const targetMeta = globalStore
                        .get(metaObjectsAtom)
                        .get(metaId);
                      if (targetMeta?.type === "note") {
                        Rendevoz.Actions.Open.Editor.openEditor(
                          Number(i.targetObjectId)
                        ).then((editor) =>
                          editor.selectBlock?.({
                            blockId: Number(i.id),
                          })
                        );
                      }
                      if (targetMeta?.type === "webpage") {
                        Rendevoz.Actions.Open.Webpage.openWebpage(
                          targetMeta?.objectId!
                        ).then((webpage) => {
                          console.log("yes yes yes");
                          webpage.transformToNote?.().then((editor) => {
                            console.log(editor, i.id);
                            editor.selectBlock?.({
                              blockId: Number(i.id),
                            });
                          });
                        });
                      }
                    }
                  }}
                />
              )}
            </Fragment>
          ))}
        </ol>
      )}
    </Content>
  );
};

const PdfSearchResult = ({
  item,
  onNavi,
}: {
  item: { specType: "pdfPage" } & SearchGroup["items"][0];
  onNavi: VoidFunction;
}) => {
  const globalSearch = useGlobalAtomValue(GlobalSearchInputAtom);
  return (
    <li
      className={ClassName.flatButton(4, "8px")}
      onClick={() => {
        onNavi();
        Rendevoz.Actions.Open.Pdf.openPdfSearchedText(
          globalSearch,
          Number(item.pageIndex),
          Number(item.targetObjectId)
        );
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: item.content }}></div>
    </li>
  );
};

const NoteSearchResult = ({
  item,
  onClick,
}: {
  item: { specType: "noteBlock" } & SearchGroup["items"][0];
  onClick: React.MouseEventHandler;
}) => (
  <li className={ClassName.flatButton(4, "8px")} onClick={onClick}>
    <div dangerouslySetInnerHTML={{ __html: item.content }}></div>
  </li>
);
const SearchDetails = memo(
  ({
    metaId,
    onNavi,
    highlightName,
  }: {
    metaId: number;
    onNavi: VoidFunction;
    highlightName?: string;
  }) => {
    const { renderTags, renderTitle, renderFrom, renderOptions, metaObject } =
      useRenderObject({ metaObjectId: metaId });
    return (
      <>
        {renderTags({
          containerStyle: {
            paddingRight: 60,
          },
          // @ts-ignore
          containerClassName: css({
            "> *": {
              fontSize: "11px !important",
            },
            "*": {
              textTransform: "capitalize !important",
            },
          }),
        })}
        {renderOptions({
          renderOnParent: false,
          zIndex: Zindexes.Modal + 1,
          style: {
            top: 0,
          },
          onClickOutside: (e, set) => {
            set(false);
          },
        })}
        {highlightName ? (
          <div
            onClick={() => {
              Rendevoz.Actions.Open.Meta.openMetaObject(metaId);
              onNavi();
            }}
            className={css([
              ClassName.ellipsisFont(2),
              DefaultObjectTitleRenderClazzName,
            ])}
            style={{ cursor: "pointer", paddingRight: 40 }}
            dangerouslySetInnerHTML={{ __html: highlightName }}
          ></div>
        ) : (
          renderTitle({
            style: {
              paddingRight: 40,
            },
            onTitleClick: () => {
              Rendevoz.Actions.Open.Meta.openMetaObject(metaId);
              onNavi();
            },
          })
        )}
      </>
    );
  }
);
export default SearchResultItem;
