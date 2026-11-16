interface Istete  {
    dropdownMenu: boolean
    dropdownEditorMEnu: boolean
    dropColorMenu: boolean
    editorOptions: {
        headeingType: string,
        font: string[],
        align: string
        list: 'bullets' | 'numbered'
    },
    noteContent: string
    color: string
}

const actions = (state: Istete)=> ({
    DROPMENU: (payload)=> state
})