import React, { useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { TextField } from '@mui/material';

interface DataItem {
    id: number;
    name: string;
    status: string;
}

const initialData: DataItem[] = [
    { id: 1, name: 'Alice', status: 'Positive' },
    { id: 2, name: 'Brigida', status: 'Neutral' },
    { id: 3, name: 'Charlie', status: 'Negative' },
    { id: 4, name: 'David', status: 'Positive' },
    { id: 5, name: 'Eve', status: 'Neutral' },
    { id: 6, name: 'Frank', status: 'Negative' },
    { id: 7, name: 'Grace', status: 'Positive' },
    { id: 8, name: 'Heidi', status: 'Neutral' },
    { id: 9, name: 'Ivan', status: 'Negative' },
    { id: 10, name: 'Judy', status: 'Positive' },
];

const PerPersonDatatable: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = initialData.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'name', headerName: 'Name', width: 150 },
        { field: 'status', headerName: 'Status', width: 150 },
    ];

    return (
        <div style={{ height: '100%', width: '100%', backgroundColor: 'white' }}>
            <h2>Individual Sentiment</h2>
            <TextField
                label="Search by name"
                variant="outlined"
                fullWidth
                margin="normal"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <DataGrid
                rows={filteredData}
                columns={columns}
                pagination
                initialState={{
                    pagination: {
                      paginationModel: { pageSize: 5, page: 0 },
                    },
                  }}
            />
        </div>
    );
};

export default PerPersonDatatable;
