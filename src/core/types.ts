export interface Tab {
    key: string;
    name: string;
    input: string;
    date: string;
    selected: boolean;
    qrs?: string[];
    painter: Map<string, string>;
    painterObject: { [key: string]: string };
}