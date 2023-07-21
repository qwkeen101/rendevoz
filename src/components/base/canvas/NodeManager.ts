import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { XYPosition } from "~/typings";

class NodeManager {
  public stage?: Konva.Stage;
  public layer?: Konva.Layer;
  public addText = (
    pos: XYPosition,
    options = {
      fontSize: 20,
      width: 200,
    }
  ) => {
    if (!this.layer || !this.stage) return;

    const textNode = new Konva.Text({
      text: "",
      x: pos.x,
      y: pos.y,
      fontSize: options.fontSize,
      draggable: true,
      width: options.width,
    });
    this.layer.add(textNode);
    const transformer = new Konva.Transformer({
      node: textNode,
      anchorCornerRadius: 999,
      anchorStroke: "#8590ae",
      borderStroke: "#8590ae",
      enabledAnchors: ["middle-left", "middle-right"],
      boundBoxFunc: (oldBox, newBox) => {
        newBox.width = Math.max(30, newBox.width);
        return newBox;
      },
    });

    textNode.on("click", () => {
      transformer.show();
      const handleOutsideClick = (e: KonvaEventObject<MouseEvent>) => {
        if (e.target !== textNode) {
          transformer.hide();
          this.layer?.off("click", handleOutsideClick);
        }
      };
      this.layer?.on("click", handleOutsideClick);
    });
    textNode.on("transform", () => {
      textNode.width(textNode.width() * textNode.scaleX());
      textNode.scaleX(1);
    });

    this.layer.add(transformer);
    textNode.on("dblclick dbltap", () => {
      textNode.hide();
      transformer.hide();
      // create textarea over canvas with absolute position
      // first we need to find position for textarea
      // how to find it?

      // at first lets find position of text node relative to the stage:
      const textPosition = textNode.absolutePosition();

      // so position of textarea will be the sum of positions above:
      const areaPosition = {
        x: this.stage!.container().offsetLeft + textPosition.x,
        y: this.stage!.container().offsetTop + textPosition.y,
      };

      // create textarea and style it
      const textarea = document.createElement("textarea");
      this.stage?.container().appendChild(textarea);

      // apply many styles to match text on canvas as close as possible
      // remember that text rendering on canvas and on the textarea can be different
      // and sometimes it is hard to make it 100% the same. But we will try...
      textarea.value = textNode.text();
      textarea.style.position = "absolute";
      textarea.style.top = areaPosition.y + "px";
      textarea.spellcheck = false;
      textarea.style.left = areaPosition.x + "px";
      textarea.style.width = textNode.width() - textNode.padding() * 2 + "px";
      // textarea.style.width = Number.MAX_SAFE_INTEGER + 'px'
      textarea.style.height =
        textNode.height() - textNode.padding() * 2 + 5 + "px";
      textarea.style.fontSize = textNode.fontSize() + "px";
      textarea.style.border = "none";
      textarea.style.padding = "0px";
      textarea.style.margin = "0px";
      textarea.style.overflow = "visible";
      textarea.style.background = "none";
      textarea.style.outline = "none";
      textarea.style.resize = "none";
      textarea.style.lineHeight = String(textNode.lineHeight());
      textarea.style.fontFamily = textNode.fontFamily();
      textarea.style.transformOrigin = "left top";
      textarea.style.textAlign = textNode.align();
      textarea.style.color = textNode.fill();
      const rotation = textNode.rotation();
      let transform = "";
      if (rotation) {
        transform += "rotateZ(" + rotation + "deg)";
      }

      let px = 0;
      // also we need to slightly move textarea on firefox
      // because it jumps a bit
      const isFirefox =
        navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
      if (isFirefox) {
        px += 2 + Math.round(textNode.fontSize() / 20);
      }
      transform += "translateY(-" + px + "px)";

      textarea.style.transform = transform;

      // reset height
      textarea.style.height = "auto";
      // after browsers resized it we can set actual value
      textarea.style.height = textarea.scrollHeight + 3 + "px";

      textarea.focus();

      // const layer = this.layer
      function removeTextarea() {
        textarea.parentNode?.removeChild(textarea);

        document.removeEventListener("click", handleOutsideClick);
        // layer?.off('pointerdown', handleClickOutside)
        textNode.show();
        transformer.hide();
        transformer.forceUpdate();
      }

      function setTextareaWidth(newWidth) {
        if (!newWidth) {
          // set width for placeholder
          newWidth = textNode.placeholder.length * textNode.fontSize();
        }
        // some extra fixes on different browsers
        const isSafari = /^((?!chrome|android).)*safari/i.test(
          navigator.userAgent
        );
        const isFirefox =
          navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
        if (isSafari || isFirefox) {
          newWidth = Math.ceil(newWidth);
        }

        const isEdge =
          document.DOCUMENT_NODE || /Edge/.test(navigator.userAgent);
        if (isEdge) {
          newWidth += 1;
        }
        textarea.style.width = newWidth + "px";
      }
      textarea.addEventListener("keydown", function (e) {
        // on esc do not set value back to node
        if (e.keyCode === 27) {
          removeTextarea();
        }
      });

      textarea.addEventListener("keydown", function (e) {
        const scale = textNode.getAbsoluteScale().x;
        setTextareaWidth(textNode.width() * scale);
        textarea.style.height = "auto";
        textarea.style.height =
          textarea.scrollHeight + textNode.fontSize() + "px";
        textNode.text(textarea.value);
      });

      function handleOutsideClick(e) {
        if (e.target !== textarea) {
          textNode.text(textarea.value);
          removeTextarea();
        }
      }
      // function handleClickOutside(e) {
      //   if (e.target !== transformer) {
      //     textNode.text(textarea.value)
      //     removeTextarea()
      //   }
      // }
      setTimeout(() => {
        document.addEventListener("click", handleOutsideClick);
        // this.layer?.on('pointerdown', handleClickOutside)
      });
    });
    textNode.fire("dblclick");
  };
}

export default NodeManager;
