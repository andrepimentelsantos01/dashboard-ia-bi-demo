import { useCallback, useEffect, useRef, useState } from "react";

export const useDashboardTabUi = () => {
    const [resetToken, setResetToken] = useState(0);
    const [openDateModal, setOpenDateModal] = useState(false);
    const [tempDateRange, setTempDateRange] = useState(null);
    const clearButtonRef = useRef(null);
    const [showFloatingClear, setShowFloatingClear] = useState(false);

    useEffect(() => {
        if (!clearButtonRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => setShowFloatingClear(!entry.isIntersecting),
            { threshold: 0.1 }
        );

        observer.observe(clearButtonRef.current);

        return () => observer.disconnect();
    }, []);

    const bumpResetToken = useCallback(() => {
        setResetToken(current => current + 1);
    }, []);

    return {
        resetToken,
        bumpResetToken,
        openDateModal,
        setOpenDateModal,
        tempDateRange,
        setTempDateRange,
        clearButtonRef,
        showFloatingClear
    };
};
