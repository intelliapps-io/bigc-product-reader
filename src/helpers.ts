import fs from 'fs'
import parse from 'csv-parse'

/** Parse Data from CSV */
export function parseCSVData(FILE_PATH: string): Promise<object[]> {
  return new Promise((resolve: (data: object[]) => void, reject: (err: Error) => void) => {
    let output: object[] = []

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

