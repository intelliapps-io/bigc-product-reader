import fsPromises from 'fs'
import parse from 'csv-parse'

/**
 * Parse CSV from file
 * @param FILE_PATH 
 * @returns Promise object array
 */
export function readCSV<T = any>(FILE_PATH: string): Promise<T[]> {
  return new Promise((resolve: (data: T[]) => void, reject: (err: Error) => void) => {
    let output: T[] = []

    const parser = parse({
      delimiter: ',',
      columns: true,
      autoParse: false,
      trim: true,
    })

    parser.on('readable', function () {
      let record
      while (record = parser.read() as any) {
        output.push(record)
      }
    })

    parser.on('error', function (err) { reject(err) })

    // parser.on('end', function () { resolve(output) })

    fsPromises.createReadStream(FILE_PATH).pipe(parser).on("end", () => {
      resolve(output)
    });
  })
}

/**
 * Write CSV File
 * @param data rows of the csv file
 * @param colums column names as string
 * @param getFields fuction returning the column for the row of the csv, from the entity providied
 * @param FILE_PATH optional, path to write the csv file
 */
export async function writeCSV<T>(options: { data: T[], colums: string[], getFields: (row: T) => any[], delimiter: string, FILE_PATH?: string }): Promise<any> {
  const { colums, data, delimiter, getFields, FILE_PATH } = options
  return new Promise((resolve: (data: any) => void, reject: (err: Error) => void) => {
    let csv = ""
    let output: any[][] = [colums]

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      output.push(getFields(row))
    }

    for (let i = 0; i < output.length; i++) {
      const row = output[i]
      let row_csv = ""
      for (let j = 0; j < row.length; j++) {
        const field = row[j]
        row_csv += `${!field ? "" : `"${field}"`}${j - 1 === row.length ? "" : delimiter}`
      }
      csv += row_csv + "\n"
    }

    if (FILE_PATH)
      fsPromises.writeFile(FILE_PATH, csv, { encoding: 'utf8' }, (err: Error | null) => {
        if (err)
          reject(err)
        else
          resolve(csv)
      })
    else
      resolve(csv)
  })
}