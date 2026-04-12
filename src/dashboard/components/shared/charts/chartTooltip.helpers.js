const TOOLTIP_VIEWPORT_PADDING = 12;
const TOOLTIP_CURSOR_OFFSET = 16;
const DEFAULT_TOOLTIP_WIDTH = 280;
const DEFAULT_TOOLTIP_HEIGHT = 120;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getTooltipTheme = () => {
    if (typeof document === "undefined") {
        return {
            backgroundColor: "rgba(255,255,255,0.94)",
            borderColor: "rgba(14, 73, 70, 0.85)",
            textColor: "#143f3d",
            boxShadow: "0 16px 28px rgba(12, 56, 53, 0.18)"
        };
    }

    const root = document.documentElement;
    const schema = root.getAttribute("data-dashboard-schema") || "default";
    const isDark = root.getAttribute("data-theme") === "dark";

    if (schema === "amazon") {
        return isDark
            ? {
                backgroundColor: "rgba(11, 18, 32, 0.96)",
                borderColor: "rgba(255, 184, 77, 0.34)",
                textColor: "#edf2f7",
                boxShadow: "0 18px 30px rgba(0, 0, 0, 0.34)"
            }
            : {
                backgroundColor: "rgba(255, 255, 255, 0.97)",
                borderColor: "rgba(31, 41, 55, 0.16)",
                textColor: "#1f2937",
                boxShadow: "0 18px 30px rgba(17, 24, 39, 0.16)"
            };
    }

    return isDark
        ? {
            backgroundColor: "rgba(12, 31, 29, 0.96)",
            borderColor: "rgba(119, 211, 198, 0.24)",
            textColor: "#dbf2ef",
            boxShadow: "0 18px 30px rgba(0, 0, 0, 0.28)"
        }
        : {
            backgroundColor: "rgba(255,255,255,0.94)",
            borderColor: "rgba(14, 73, 70, 0.85)",
            textColor: "#143f3d",
            boxShadow: "0 16px 28px rgba(12, 56, 53, 0.18)"
        };
};

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

export const buildResponsiveTooltip = (formatter, overrides = {}) => {
    const tooltipTheme = getTooltipTheme();

    return {
        trigger: "item",
        appendToBody: true,
        confine: true,
        alwaysShowContent: false,
        enterable: false,
        triggerOn: "mousemove|click",
        renderMode: "html",
        transitionDuration: 0,
        backgroundColor: tooltipTheme.backgroundColor,
        borderColor: tooltipTheme.borderColor,
        borderWidth: 1,
        textStyle: {
            color: tooltipTheme.textColor,
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
            `box-shadow:${tooltipTheme.boxShadow}`
        ].join(";"),
        position: getResponsiveTooltipPosition,
        formatter,
        ...overrides
    };
};
