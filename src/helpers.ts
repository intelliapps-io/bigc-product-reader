import fs from 'fs'
import parse from 'csv-parse'
import { CLEntity } from './types'

/**
 * Parse CSV from file
 * @param FILE_PATH 
 * @returns Promise object array
 */
export function parseCSVData<T=any>(FILE_PATH: string): Promise<T[]> {
  return new Promise((resolve: (data: T[]) => void, reject: (err: Error) => void) => {
    let output: T[] = []

    const parser = parse({
      delimiter: ',',
      columns: true,
      autoParse: true,
    })

    parser.on('readable', function () {
      let record
      while (record = parser.read() as any) {
        output.push(record)
      }
    })

    parser.on('error', function (err) { reject(err) })

    parser.on('end', function () { resolve(output) })

    fs.createReadStream(FILE_PATH).pipe(parser);
  })
}

/**
 * Write CSV File
 * @param data rows of the csv file
 * @param colums column names as string
 * @param getFields fuction returning the column for the row of the csv, from the entity providied
 * @param FILE_PATH optional, path to write the csv file
 * @returns 
 */
export async function writeCSV<T>(data: T[], colums: string[], getFields: (row: T) => any[], FILE_PATH?: string): Promise<any> {
  return new Promise((resolve: (data: any) => void, reject: (err: Error) => void) => {
    let csv = ""
    let output: any[][] = [
      colums
    ]
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      output.push(getFields(row))
    }

    for (let i = 0; i < output.length; i++) {
      const row = output[i]
      let row_csv = ""
      for (let j = 0; j < row.length; j++) {
        const field = row[j]
        row_csv += `${!field ? "" : `"${field}"`}${j - 1 === row.length ? "" : ","}`
      }
      csv += row_csv + "\n"
    }
    
    if (FILE_PATH)
      fs.writeFileSync(FILE_PATH, csv, { encoding: 'utf8' })
    
      resolve(csv)
  })
}

/**
 * Remove item from array
 * @param array Array to edit
 * @param index item to remove
 * @returns 
 */
export function removeAtIndex<T=any>(array: Array<T>, index: number) {
  const copy = [...array]
  copy.splice(index, 1)
  return copy
}