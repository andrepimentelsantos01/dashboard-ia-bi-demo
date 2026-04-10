import React, { useEffect, useState, useMemo } from "react";
import { useGaugeCountState } from "./gaugeCount.state";
import "./GaugeCount.css";

const GaugeCount = ({ value, extra, invertColors = false }) => {
    const numericValue = useMemo(() => {
        return typeof value === "string"
            ? Number(value.replace("%", "").trim())
            : Number(value);
    }, [value]);

    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        let frame;
        const duration = 350;
        const start = performance.now();
        const end = numericValue || 0;
        const easing = (t) => 1 - (1 - t) ** 3;

        const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            setAnimatedValue(end * easing(progress));
            if (progress < 1) frame = requestAnimationFrame(animate);
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [numericValue]);

    const stateProps = useMemo(
        () => ({ value: animatedValue, tooltipData: extra, invertColors }),
        [animatedValue, extra, invertColors]
    );

    const { chartRef } = useGaugeCountState(stateProps);

    return (
        <div className="gauge-count-container">
            <div ref={chartRef} className="gauge-count-wrapper" />
        </div>
    );
};

export default React.memo(GaugeCount);
