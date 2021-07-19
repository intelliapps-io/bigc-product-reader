import fs from 'fs'
import { BCFieldName, BCItemType, CLEntity, CLFieldName } from './types'
import { parseCSVData, removeAtIndex, writeCSV } from './helpers'
import * as stringSimilarity from 'string-similarity';

/** Entry */
export async function mergeProducts(options: { FILES_PATH: {bigCommerce: string, clover: string} }) {
  // const FILES_PATH = { bigCommerce: `${__dirname}/result.csv`, clover: `${__dirname}/source_data/clover-inventory.csv` }
  const { FILES_PATH } = options
  const csvCLResult = await parseCSVData(FILES_PATH.clover).catch(err => { throw err })
  let parsedCLData: CLEntity[] = clCSVtoCLEntity(csvCLResult)
  let parsedBCData: CLEntity[] = await parseCSVData<CLEntity>(FILES_PATH.bigCommerce).catch(err => { throw err })

  interface NameResult { bgName: string, clName: string, bcRowId: number, similarity: number }
  let matchedRecords: CLEntity[] = []

  // console.log(stringSimilarity.compareTwoStrings("Blue Raspberry Gummy Bears [Size=32 oz.]", "Blue Raspberry Gummy Bears/2lbs"))

  for (let i = 0; i < parsedCLData.length; i++) {
    let nameResults: NameResult[] = []
    const clItem = parsedCLData[i]

    for (let j = 0; j < parsedBCData.length; j++) {
      let bcItem = parsedBCData[j]
      const similarity = stringSimilarity.compareTwoStrings(clItem.name, bcItem.name)

      if (similarity > 0.60)
        if (Math.round(Number.parseFloat(clItem.price + '')) === Math.round(Number.parseFloat(`${bcItem.price}`)))
          nameResults.push({ bcRowId: j, bgName: bcItem.name, clName: clItem.name, similarity })
    }

    // sort best match
    nameResults.sort((a, b) => b.similarity - a.similarity)

    // match found
    if (nameResults[0]) {
      const nameResult = nameResults[0]
      const bcItem = parsedBCData[nameResult.bcRowId];
      
      // remove BC record, no repeat
      parsedBCData = removeAtIndex<CLEntity>(parsedBCData, nameResult.bcRowId)

      // remove CL record, no repeat
      parsedCLData = removeAtIndex(parsedCLData, i)

      matchedRecords.push({
        name: nameResult.bgName,
        clName: nameResult.clName,
        price: clItem.price,
        SKU: clItem.SKU,
        description: bcItem.description,
        price_type: "Fixed",
        cost: 0,
        tax_rates: ['DEFAULT'],
        quantity: 0,
        category: bcItem.category,
        clover_ID: clItem.clover_ID,
        bcSKU: bcItem.SKU
      })
    }
  }

  // merge matched with unmatched records
  const merged = [...matchedRecords, ...parsedCLData, ...parsedBCData]

  await writeCSV<CLEntity>(
    merged,
    [
      "name",
      "clName",
      "price",
      "SKU",
      "description",
      "price_type",
      "cost",
      "tax_rates",
      "quantity",
      "category",
      "clover_ID",
      "bcSKU"
    ],
    (record) => ([
      record.name,
      record.clName,
      record.price,
      record.SKU,
      record.description,
      record.price_type,
      record.cost,
      record.tax_rates,
      record.quantity,
      record.category,
      record.clover_ID,
      record.bcSKU
    ]),
    FILES_PATH.bigCommerce
  )

}

function clCSVtoCLEntity(parsedCSVData: any[]): CLEntity[] {
  let output: CLEntity[] = []
  parsedCSVData.forEach(item => {
    output.push({
      name: "",
      clName: item[CLFieldName['Name']],
      price: item[CLFieldName['Price']],
      SKU: item[CLFieldName['SKU']],
      description: "",
      price_type: item[CLFieldName['Price Type']],
      cost: item[CLFieldName['Cost']],
      tax_rates: item[CLFieldName['Tax Rates']],
      quantity: item[CLFieldName['Quantity']],
      category: item[CLFieldName['Labels']],
      clover_ID: item[CLFieldName['Clover ID']],
      bcSKU: "",
    })
  })
  return output
}

mergeProducts({ FILES_PATH: { bigCommerce: `${__dirname}/result.csv`, clover: `${__dirname}/source_data/clover-inventory.csv` } })
  .then(() => console.log("done"))
  .catch((e) => console.error(e))