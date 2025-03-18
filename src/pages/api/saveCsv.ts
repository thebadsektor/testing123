import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { data } = req.body; // Expecting the CSV data in the request body

        // Define the path to the temp folder
        const tempFolderPath = path.join(process.cwd(), 'temp'); // Adjust the path as needed
        const filePath = path.join(tempFolderPath, `tagged_data_${Date.now()}.csv`);

        // Ensure the temp folder exists
        if (!fs.existsSync(tempFolderPath)) {
            fs.mkdirSync(tempFolderPath);
        }

        // Write the CSV data to a file
        fs.writeFile(filePath, data, (err) => {
            if (err) {
                console.error('Error saving CSV file:', err);
                return res.status(500).json({ message: 'Error saving file' });
            }
            res.status(200).json({ message: 'File saved successfully' });
        });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 