import fs from 'fs'
import parse from 'csv-parse'
import transform from 'stream-transform'
import { BCFieldName, BCItemType, CLEntity } from './types'

/** Parse Data from CSV */
function parseData(FILE_PATH: string): Promise<object[]> {
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

/** Create Clover Record from BigCommerce */
function mapRecordToCLEntity(record: any, parentRecord?: any): CLEntity {
  let entity: CLEntity = {
    name: record[BCFieldName['Product Name']],
    price: record[BCFieldName['Price']].trim().replace("[FIXED]", ""),
    SKU: record[BCFieldName['Product Code/SKU']],
    description: record[BCFieldName['Product Description']],
    price_type: "Fixed",
    cost: 0,
    tax_rates: ['DEFAULT'],
    quantity: 0,
    category: record[BCFieldName['Category']]
  }

  const parentName = parentRecord ? parentRecord[BCFieldName['Product Name']] : undefined
  if (parentName) {
    const splitChildName = record[BCFieldName['Product Name']]
      .replace('[RT]', '')
      .replace('[RB]', '')
      .replace('[CS]', '')
      .replace('[S]', '')
      .replace(',', ', ')
      .trim()

    // set name
    entity.name = `${parentName} [${splitChildName}]`

    // carry price
    if (!entity.price)
      entity.price = parentRecord[BCFieldName['Price']]
  }

  return entity
}

async function writeCSV(data: CLEntity[], FILE_PATH: string): Promise<any> {
  return new Promise((resolve: (data: any) => void, reject: (err: Error) => void) => {
    let csv = ""
    let output: any[][] = [
      ["name", "price", "SKU", "category", "description", "price_type", "cost", "tax_rates", "quantity",]
    ]
    for (let i = 0; i < data.length; i++) {
      const entity = data[i]
      const row = [entity.name, entity.price, entity.SKU, entity.category, entity.description, entity.price_type, entity.cost, entity.tax_rates, entity.quantity]
      output.push(row)
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

    resolve(csv)

    fs.writeFileSync(FILE_PATH, csv, { encoding: 'utf8' })
  })
}

/** 
 * Entry - MAIN
 */
async function main() {
  const FILE_PATH = `${__dirname}/products.csv`;
  const OUT_PATH = `${__dirname}/result.csv`;
  const parsedData = await parseData(FILE_PATH)
  /** Mapped data variable */
  let output: CLEntity[] = []

  /** Map parsedData to CLEntity */
  let parentRecord: object | undefined
  for (let i = 0; i < parsedData.length; i++) {
    let record = parsedData[i] as any
    let entity: CLEntity

    /** Parent Record */
    if (record[BCFieldName['Item Type']] === BCItemType['Product']) {
      // set or reset parent record
      parentRecord = undefined
      entity = mapRecordToCLEntity(record, parentRecord)
      if (entity.SKU)
        output.push(entity)
    }

    /** SKU Record */
    else if (record[BCFieldName['Item Type']].trim() === BCItemType['SKU']) {
      // set parent record
      if (typeof parentRecord === "undefined")
        parentRecord = parsedData[i - 1]

      entity = mapRecordToCLEntity(record, parentRecord)

      if (entity.SKU)
        output.push(entity)
    }

    /** Rule Record */
    else if (record[BCFieldName['Item Type']].trim() === BCItemType['Rule']) {
      // get rule price
      const sku = record[BCFieldName['Product Code/SKU']]
      const price = record[BCFieldName['Price']].trim().replace("[FIXED]", "")

      // find existing product
      for (let j = 0; j < output.length; j++) {
        if (output[j].SKU === sku && price) {
          output[j] = { ...output[j], price } // update price
          // return
        }
      }
    }
  }

  // console.log(output)
  const csvString = await writeCSV(output, OUT_PATH)
  console.log(csvString);
}

main()
  .then(() => console.log("done"))
  .catch((e) => console.error(e))