export interface Folders {
    folders: Folder[];
}

export interface Folder {
    color:     string;
    id:        string;
    name:      string;
    createdAt: AtedAt;
    userId:    string;
    icon:      string;
    updatedAt: AtedAt;
}

export interface AtedAt {
    type:        string;
    seconds:     number;
    nanoseconds: number;
}
