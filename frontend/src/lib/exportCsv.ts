type CsvRow = Record<string, unknown>;

function escapeCsvCell(value: unknown): string {
    let text = value == null ? "" : String(value);

    // Prevent spreadsheet applications from evaluating untrusted cells as formulas.
    if (/^[=+\-@\t\r]/.test(text)) {
        text = `'${text}`;
    }

    return `"${text.replace(/"/g, '""')}"`;
}

export function exportCsv(filename: string, headers: readonly string[], rows: CsvRow[]): void {
    const csv = [
        headers.map(escapeCsvCell).join(","),
        ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}
