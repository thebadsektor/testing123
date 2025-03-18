// src
"use client";

import { ChangeEvent, useState } from "react";
import Papa from "papaparse";
import { DataFrame } from "danfojs";
import { DataGrid } from "@mui/x-data-grid";
import UploadIcon from "@mui/icons-material/Upload";
import CheckIcon from "@mui/icons-material/Check";

interface CsvUploadProps {
  setDataFrame: (dataFrame: DataFrame | null) => void;
}

interface CsvData {
  data: string[][];
  headers: string[];
}

export default function CsvUpload({ setDataFrame }: CsvUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<
    Record<string, string | number>[]
  >([]);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 5,
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      parseCsv(selectedFile);
    } else {
      alert("Invalid file. Please upload a valid CSV format.");
    }
  };

  const parseCsv = (file: File) => {
    setIsProcessing(true);
    Papa.parse(file, {
      complete: (results) => {
        const headers = results.data[0] as string[];
        const rows = results.data.slice(1) as string[][];

        if (!headers || rows.length === 0) {
          alert(
            "The uploaded file seems to be empty or improperly formatted. Please check and try again."
          );
          setCsvData(null);
          setIsProcessing(false);
          return;
        }

        setCsvData({ data: rows, headers });
        setSelectedColumns(headers);
        setIsProcessing(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        alert(
          "The uploaded file seems to be empty or improperly formatted. Please check and try again."
        );
        setIsProcessing(false);
      },
      header: false,
      skipEmptyLines: true,
    });
  };

  const toggleColumn = (header: string) => {
    setSelectedColumns((prev) =>
      prev.includes(header)
        ? prev.filter((col) => col !== header)
        : [...prev, header]
    );
  };

  const processSelectedColumns = () => {
    if (!csvData || selectedColumns.length === 0) return;

    const processedData = csvData.data.map((row) => {
      const processedRow: Record<string, string | number> = {};
      selectedColumns.forEach((header) => {
        const index = csvData.headers.indexOf(header);
        processedRow[header] = row[index];
      });
      return processedRow;
    });

    setProcessedData(processedData);

    try {
      const df = new DataFrame(processedData, { columns: selectedColumns });
      setDataFrame(df);
    } catch (error) {
      console.error("Error creating DataFrame:", error);
      alert("Error creating DataFrame. Check console for details.");
    }
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2 text-center">
        Upload Your CSV File
      </h3>
      <p className="text-gray-600 text-center mb-4">
        Upload your CSV file to select and process data columns for analysis.
      </p>
      <div className="flex justify-center mx-auto items-center mt-4 mb-4 bg-blue-50 p-4 rounded-md w-[30%]">
        <a
          href="/sample-files/10-kaggle.csv"
          download
          className="text-blue-500 hover:text-blue-600 underline text-center"
        >
          Download Sample CSV File
        </a>
      </div>
      <div className="flex flex-col items-center justify-center min-h-40 gap-4">
        <label className="relative cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center">
          <UploadIcon className="mr-2" />
          <span>{file ? file.name : "Upload CSV"}</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {isProcessing && <div className="text-gray-600">Processing CSV...</div>}

        {csvData && (
          <div className="w-full mt-4">
            <h3 className="text-lg font-semibold mb-2 text-center">
              Choose Columns to Include in DataFrame:
            </h3>
            <p className="text-gray-600 text-center">
              Check the columns you want to include in the generated DataFrame.
              Unselected columns will be excluded.
            </p>
            <div className="flex justify-center flex-wrap gap-2 mb-8 mt-8">
              {csvData.headers.map((header) => (
                <label key={header} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(header)}
                    onChange={() => toggleColumn(header)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{header}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={processSelectedColumns}
                disabled={selectedColumns.length === 0}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
              >
                <CheckIcon className="mr-2" />
                Create DataFrame
              </button>
            </div>
          </div>
        )}
        {processedData.length > 0 && (
          <>
            <p className="text-gray-600">Total Rows: {processedData.length}</p>
            <h3 className="text-lg font-semibold mt-8">Processed Dataframe</h3>
            <p className="text-gray-600 text-center">
              View the processed data in the DataFrame. Use pagination to
              explore the data.
            </p>
            <div style={{ height: 400, width: "100%" }}>
              <DataGrid
                rows={processedData}
                columns={selectedColumns.map((header) => ({
                  field: header,
                  headerName: header,
                  width: 150,
                }))}
                pagination
                paginationMode="client"
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[5, 10, 25]}
                loading={false}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
