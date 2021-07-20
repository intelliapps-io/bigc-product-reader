import fs from 'fs'
import parse from 'csv-parse'
import { BCFieldName, BCItemType, CLEntity } from './types'
import { parseCSVData, writeCSV } from './helpers'
import { mergeProducts } from './mergeProducts'

/** Create Clover Record from BigCommerce */
function mapBCRecordToCLEntity(record: any, parentRecord?: any): CLEntity {
  let entity: CLEntity = {
    name: record[BCFieldName['Product Name']],
    price: record[BCFieldName['Price']].trim().replace("[FIXED]", ""),
    SKU: record[BCFieldName['Product Code/SKU']],
    description: "",
    price_type: "Fixed",
    cost: 0,
    tax_rates: ['DEFAULT'],
    quantity: 0,
    category: record[BCFieldName['Category']],
    clover_ID: "",
    clName: ""
  }

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

/** 
 * Entry - MAIN
 */
async function main() {
  const FILE_PATH = `${__dirname}/source_data/bc-products.csv`
  const OUT_PATH = `${__dirname}/result.csv`
  const parsedData = await parseCSVData(FILE_PATH)

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
      entity = mapBCRecordToCLEntity(record, parentRecord)
      if (entity.SKU)
        output.push(entity)
    }

    /** SKU Record */
    else if (record[BCFieldName['Item Type']].trim() === BCItemType['SKU']) {
      // set parent record
      if (typeof parentRecord === "undefined")
        parentRecord = parsedData[i - 1]

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

  // const csvString = await writeCSV(output, OUT_PATH)
  await writeCSV<CLEntity>(
    output,
    ["name", "clName", "price", "SKU", "bcSKU", "category", "description",
      "price_type", "cost", "tax_rates", "quantity", "clover_ID"],
    (entity) => [entity.name, "", entity.price, entity.SKU, "", entity.category,
    entity.description && entity.description.length < 20 ? entity.description : "",
      entity.price_type, entity.cost, entity.tax_rates, entity.quantity, entity.clover_ID],
    ";",
    OUT_PATH
  ).catch(err => {
    console.log('Could not export first CSV.')
    throw err
  })

  console.log("Exported products")

  // setTimeout(() => {
  //   mergeProducts({ FILES_PATH: { bigCommerce: OUT_PATH, clover: `${__dirname}/source_data/clover-inventory.csv` } })
  //     .catch(err => { throw err })
  //     .then(() => console.log("Merged products"))
  // }, 1000)


}

main()
  .then(() => console.log("done"))
  .catch((e) => console.error(e))