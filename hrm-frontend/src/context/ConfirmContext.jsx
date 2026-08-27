import { createContext, useCallback, useContext, useRef, useState } from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [state, setState] = useState({ open: false, options: {} });
    const resolverRef = useRef(null);

    const confirm = useCallback((options = {}) => {
        const normalized = typeof options === "string" ? { message: options } : options;
        setState({ open: true, options: normalized });
        return new Promise((resolve) => {
            resolverRef.current = resolve;
        });
    }, []);

    const settle = useCallback((result) => {
        setState((prev) => ({ ...prev, open: false }));
        if (resolverRef.current) {
            resolverRef.current(result);
            resolverRef.current = null;
        }
    }, []);

    const {
        title = "Please confirm",
        message = "Are you sure?",
        confirmText = "Confirm",
        cancelText = "Cancel"
    } = state.options;

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {state.open && (
                <div className="modal-overlay" onClick={() => settle(false)}>
                    <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                        <h2>{title}</h2>
                        <p>{message}</p>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => settle(false)}>
                                {cancelText}
                            </button>
                            <button type="button" className="btn-primary" onClick={() => settle(true)}>
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const confirm = useContext(ConfirmContext);
    if (!confirm) {
        throw new Error("useConfirm must be used within a ConfirmProvider");
    }
    return confirm;
}
