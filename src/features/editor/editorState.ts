export interface EditorState {
    copied: boolean;
    showFolderMenu: boolean;
    showColorMenu: boolean;
    showBlockMenu: boolean;
    showEditorState: boolean;
}

export type EditorAction =
    | { type: "SET_COPIED"; payload: boolean }
    | { type: "TOGGLE_FOLDER_MENU" }
    | { type: "CLOSE_FOLDER_MENU" }
    | { type: "TOGGLE_COLOR_MENU" }
    | { type: "CLOSE_COLOR_MENU" }
    | { type: "TOGGLE_BLOCK_MENU" }
    | { type: "CLOSE_BLOCK_MENU" }
    | { type: "TOGGLE_EDITOR_STATE" };

export const INITIAL_EDITOR_STATE: EditorState = {
    copied: false,
    showFolderMenu: false,
    showColorMenu: false,
    showBlockMenu: false,
    showEditorState: false,
};

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
    switch (action.type) {
        case "SET_COPIED":
            return { ...state, copied: action.payload };
        case "TOGGLE_FOLDER_MENU": {
            const showFolderMenu = !state.showFolderMenu;
            return {
                ...state,
                showFolderMenu,
                showColorMenu: showFolderMenu ? false : state.showColorMenu,
            };
        }
        case "CLOSE_FOLDER_MENU":
            return { ...state, showFolderMenu: false };
        case "TOGGLE_COLOR_MENU": {
            const showColorMenu = !state.showColorMenu;
            return {
                ...state,
                showColorMenu,
                showFolderMenu: showColorMenu ? false : state.showFolderMenu,
            };
        }
        case "CLOSE_COLOR_MENU":
            return { ...state, showColorMenu: false };
        case "TOGGLE_BLOCK_MENU":
            return { ...state, showBlockMenu: !state.showBlockMenu };
        case "CLOSE_BLOCK_MENU":
            return { ...state, showBlockMenu: false };
        case "TOGGLE_EDITOR_STATE":
            return { ...state, showEditorState: !state.showEditorState };
        default: {
            const exhaustiveCheck: never = action;
            return exhaustiveCheck;
        }
    }
}
