import { DataFrame as DanfoDataFrame } from 'danfojs';
import { DataFrame, DataRow, CustomDataFrame } from '../../types/Dataframe';

export const convertDanfoToCustomDataFrame = (danfoDf: DanfoDataFrame): DataFrame => {
  const columns: string[] = danfoDf.columns;
  const rows = (danfoDf.values as (string | number)[][]).map((row) => {
    const rowObject: DataRow = {};
    columns.forEach((col, index) => {
      rowObject[col] = row[index];
    });
    return rowObject;
  });

  return new CustomDataFrame(columns, rows);
};
