export interface DataFrame {
    columns: string[];
    rows: DataRow[];
    getRowCount: () => number;
    isValid: () => boolean;
}

export interface DataRow {
    [key: string]: string | number | boolean;
}

export class CustomDataFrame implements DataFrame {
    columns: string[];
    rows: DataRow[];

    constructor(columns: string[], rows: DataRow[]) {
        this.columns = columns;
        this.rows = rows;
    }

    getRowCount(): number {
        return this.rows.length;
    }

    isValid(): boolean {
        return Array.isArray(this.rows) && this.columns.length > 0;
    }
}