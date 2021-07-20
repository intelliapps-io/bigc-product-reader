import fs from 'fs'
import parse from 'csv-parse'
import { BCFieldName, BCItemType, CLEntity } from './types'
import { mapBCProductsToCLEntity, mapCLInventoryToCLEntity, readCSV, writeCSV } from './helpers'
import { mergeProducts } from './mergeProducts'

async function main() {
  const FILE_LOCATION = {
    bc_products: `${__dirname}/source_data/bc-products.csv`,
    clover_inventory: `${__dirname}/source_data/clover-inventory.csv`,
    bc_output: `${__dirname}/source_data/bc-output.csv`,
    merged: `${__dirname}/merged.csv`
  }

  const CSV_BIG_COMMERCE_DATA = await readCSV(FILE_LOCATION.bc_products).catch(err => { throw err })
  const CSV_CLOVER_DATA = await readCSV(FILE_LOCATION.clover_inventory).catch(err => { throw err })

  const bc_products = mapBCProductsToCLEntity(CSV_BIG_COMMERCE_DATA)
  const cl_products = mapCLInventoryToCLEntity(CSV_CLOVER_DATA)

  const mergedRecords = mergeProducts({ bc_products, cl_products })

  // Merged Records
  writeCSV({
    colums: ["name", "clName", "price", "SKU", "bcSKU", "category", "description",
    "price_type", "cost", "tax_rates", "quantity", "clover_ID"],
    data: mergedRecords,
    delimiter: ',',
    getFields: (entity) => ([entity.name, entity.clName, entity.price, entity.SKU, entity.bcSKU, entity.category,
    entity.description && entity.description.length < 20 ? entity.description : "",
      entity.price_type, entity.cost, entity.tax_rates, entity.quantity, entity.clover_ID]),
    FILE_PATH: FILE_LOCATION.merged
  }).catch(err => {
    console.log('Could not export first CSV.')
    throw err
  })

  // BC Product List
  writeCSV({
    colums: ["name", "clName", "price", "SKU", "bcSKU", "category", "description",
    "price_type", "cost", "tax_rates", "quantity", "clover_ID"],
    data: bc_products,
    delimiter: ',',
    getFields: (entity) => ([entity.name, entity.clName, entity.price, entity.SKU, entity.bcSKU, entity.category,
    entity.description && entity.description.length < 20 ? entity.description : "",
      entity.price_type, entity.cost, entity.tax_rates, entity.quantity, entity.clover_ID]),
    FILE_PATH: FILE_LOCATION.bc_output
  }).catch(err => {
    console.log('Could not export first CSV.')
    throw err
  })



}

main()
  .then(() => console.log("done"))
  .catch((e) => console.error(e))