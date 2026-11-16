import React, { createContext, useContext, useState } from "react";

const INITIAL_VALUE = {
    notes: [],
    folders: [],
    profile: null as any
}
type state = typeof INITIAL_VALUE
export const AppContext = createContext<state>(INITIAL_VALUE)

export const AppProvider = ({children}: {children: React.ReactNode}) => {
    const [value, setValue] = useState(INITIAL_VALUE)
    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}
