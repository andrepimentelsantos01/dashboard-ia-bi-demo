import { useState, useCallback, useMemo } from "react";

export function useLocalChartReset(initialState = {}) {
    const init = useMemo(() => initialState, [initialState]);

    const [state, setState] = useState({
        local: init,
        resetToken: 0
    });

    const updateField = useCallback((key, value) => {
        setState(s => ({
            ...s,
            local: { ...s.local, [key]: value }
        }));
    }, []);

    const clearLocal = useCallback(() => {
        setState(s => ({
            local: init,
            resetToken: s.resetToken + 1
        }));
    }, [init]);

    return {
        localState: state.local,
        updateField,
        clearLocal,
        resetToken: state.resetToken
    };
}
