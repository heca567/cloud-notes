export interface ActiveFormats {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    bulletList: boolean;
    orderedList: boolean;
    alignLeft: boolean;
    alignCenter: boolean;
    alignRight: boolean;
    alignJustify: boolean;
    currentBlock: string;
}

export interface EditorStats {
    words: number;
    chars: number;
    readTime: number;
}
