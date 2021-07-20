import fsPromises from 'fs'
import parse from 'csv-parse'
import { BCFieldName, BCItemType, CLEntity, CLFieldName } from './types'

/**
 * Parse CSV from file
 * @param FILE_PATH 
 * @returns Promise object array
 */
export function readCSV<T = any>(FILE_PATH: string, delimiter?: string): Promise<T[]> {
  return new Promise((resolve: (data: T[]) => void, reject: (err: Error) => void) => {
    let output: T[] = []

    const parser = parse({
      delimiter: delimiter ? delimiter : ',',
      columns: true,
      autoParse: false,
      trim: true,
    })

    // fix broken csv object into readable object
    const cleanObjectKeys = (sourceObject: object) => {
      let resultObject: any = {}
      for (const [key, value] of Object.entries(sourceObject)) {
        resultObject[`${key}`.trim()] = value
      }
      return resultObject
    }

    parser.on('readable', function () {
      let record
      while (record = parser.read() as any) {
        output.push(cleanObjectKeys(record))
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

/**
 * BigCommerce Raw CSV to CLEntity
 * @param data 
 */
export function mapBCProductsToCLEntity(data: any[]): CLEntity[] {
  let output: CLEntity[] = []
  let parentRecord: object | undefined
  const mapBCRecordToCLEntity = (record: any, parentRecord?: any): CLEntity => {
    let entity: CLEntity = {
      name: record[BCFieldName['Product Name']],
      price: record[BCFieldName['Price']].trim().replace("[FIXED]", ""),
      SKU: record[BCFieldName['Product Code/SKU']],
      description: "", //TODO: add record
      price_type: "Fixed",
      cost: 0,
      tax_rates: ['DEFAULT'],
      quantity: 0,
      category: record[BCFieldName['Category']],
      clover_ID: "",
      clName: "",
      bcSKU: record[BCFieldName['Product Code/SKU']],
      price_unit: "",
      product_code: ""
    };

    const parentName = parentRecord ? parentRecord[BCFieldName['Product Name']] : undefined
    const parentCategory = parentRecord ? parentRecord[BCFieldName['Category']] : undefined
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

      // set parent cagegory
      if (parentCategory)
        entity.category = parentCategory;

      // carry price
      if (!entity.price)
        entity.price = parentRecord[BCFieldName['Price']]
    }

    return entity
  }

  // Map data to CLEntity
  for (let i = 0; i < data.length; i++) {
    const record = data[i] as any
    let entity: CLEntity

    /** Parent Record */
    if (record[BCFieldName['Item Type']].trim() === BCItemType['Product']) {
      // set or reset parent record
      parentRecord = undefined
      entity = mapBCRecordToCLEntity(record, parentRecord)
      if (entity.SKU)
        output.push(entity)
    }

    /** SKU Record */
    else if (record[BCFieldName['Item Type']].trim() === BCItemType['SKU']) {
      // set parent record
      if (typeof parentRecord === "undefined")
        parentRecord = data[i - 1]

      entity = mapBCRecordToCLEntity(record, parentRecord)

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

  return output
}

/**
 * Clover Inventory Raw CSV to CLEntity
 * @param data 
 */
export function mapCLInventoryToCLEntity(data: any[]): CLEntity[] {
  let output: CLEntity[] = []
  for (let i = 0; i < data.length; i++) {
    const record = data[i] as any
    output.push({
      name: record[CLFieldName['Name']],
      price: record[CLFieldName['Price']],
      SKU: record[CLFieldName['SKU']],
      description: "",
      price_type: record[CLFieldName['Price Type']],
      cost: record[CLFieldName['Cost']],
      tax_rates: record[CLFieldName['Tax Rates']],
      quantity: record[CLFieldName['Quantity']],
      category: "",
      clover_ID: record[CLFieldName['Clover ID']],
      clName: record[CLFieldName['Name']],
      bcSKU: "",
      price_unit: record[CLFieldName['Price Unit']],
      product_code: ""
    })
  }
  return output
}

/**
 * Remove item from array
 * @param array Array to edit
 * @param index item to remove
 * @returns 
 */
 export function removeAtIndex<T>(array: Array<T>, index: number) {
  const copy = [...array]
  copy.splice(index, 1)
  return copy
}