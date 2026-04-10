const TOOLTIP_VIEWPORT_PADDING = 12;
const TOOLTIP_CURSOR_OFFSET = 16;
const DEFAULT_TOOLTIP_WIDTH = 280;
const DEFAULT_TOOLTIP_HEIGHT = 120;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getViewportSize = (fallbackWidth, fallbackHeight) => {
    if (typeof window === "undefined") {
        return [fallbackWidth, fallbackHeight];
    }

    const viewportWidth = window.visualViewport?.width || window.innerWidth || fallbackWidth;
    const viewportHeight = window.visualViewport?.height || window.innerHeight || fallbackHeight;

    return [viewportWidth, viewportHeight];
};

export const getResponsiveTooltipPosition = (pos, params, dom, rect, size) => {
    const [mouseX = 0, mouseY = 0] = pos || [];
    const [rawContentWidth = DEFAULT_TOOLTIP_WIDTH, rawContentHeight = DEFAULT_TOOLTIP_HEIGHT] = size?.contentSize || [];
    const [rawViewWidth = 0, rawViewHeight = 0] = size?.viewSize || [];
    const [viewportWidth, viewportHeight] = getViewportSize(rawViewWidth, rawViewHeight);

    const availableWidth = Math.max(viewportWidth - TOOLTIP_VIEWPORT_PADDING * 2, 160);
    const availableHeight = Math.max(viewportHeight - TOOLTIP_VIEWPORT_PADDING * 2, 120);
    const contentWidth = Math.min(rawContentWidth, availableWidth);
    const contentHeight = Math.min(rawContentHeight, availableHeight);

    const preferredLeft = mouseX + TOOLTIP_CURSOR_OFFSET;
    const fallbackLeft = mouseX - contentWidth - TOOLTIP_CURSOR_OFFSET;
    const preferredTop = mouseY + TOOLTIP_CURSOR_OFFSET;
    const fallbackTop = mouseY - contentHeight - TOOLTIP_CURSOR_OFFSET;

    const left =
        preferredLeft + contentWidth + TOOLTIP_VIEWPORT_PADDING <= viewportWidth
            ? preferredLeft
            : clamp(fallbackLeft, TOOLTIP_VIEWPORT_PADDING, viewportWidth - contentWidth - TOOLTIP_VIEWPORT_PADDING);

    const top =
        preferredTop + contentHeight + TOOLTIP_VIEWPORT_PADDING <= viewportHeight
            ? preferredTop
            : clamp(fallbackTop, TOOLTIP_VIEWPORT_PADDING, viewportHeight - contentHeight - TOOLTIP_VIEWPORT_PADDING);

    return {
        left: clamp(left, TOOLTIP_VIEWPORT_PADDING, viewportWidth - contentWidth - TOOLTIP_VIEWPORT_PADDING),
        top: clamp(top, TOOLTIP_VIEWPORT_PADDING, viewportHeight - contentHeight - TOOLTIP_VIEWPORT_PADDING)
    };
};

export const buildResponsiveTooltip = (formatter, overrides = {}) => ({
    trigger: "item",
    appendToBody: true,
    confine: true,
    alwaysShowContent: false,
    enterable: false,
    triggerOn: "mousemove|click",
    renderMode: "html",
    transitionDuration: 0,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: "rgba(14, 73, 70, 0.85)",
    borderWidth: 1,
    textStyle: {
        color: "#143f3d",
        fontSize: 12,
        lineHeight: 18
    },
    padding: 14,
    extraCssText: [
        "max-width:min(360px, calc(100vw - 24px))",
        "max-height:calc(100vh - 24px)",
        "white-space:normal",
        "overflow:hidden auto",
        "word-break:break-word",
        "overflow-wrap:anywhere",
        "box-sizing:border-box",
        "border-radius:12px",
        "box-shadow:0 16px 28px rgba(12, 56, 53, 0.18)"
    ].join(";"),
    position: getResponsiveTooltipPosition,
    formatter,
    ...overrides
});
