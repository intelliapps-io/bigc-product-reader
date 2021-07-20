import fs from 'fs'
import { BCFieldName, BCItemType, CLEntity, CLFieldName } from './types'
import { parseCSVData, removeAtIndex, writeCSV } from './helpers'
import * as stringSimilarity from 'string-similarity';

/** Entry */
export async function mergeProducts(options: { OUT_PATH: string,  FILES_PATH: {bigCommerce: string, clover: string} }) {
  // const FILES_PATH = { bigCommerce: `${__dirname}/result.csv`, clover: `${__dirname}/source_data/clover-inventory.csv` }
  const { FILES_PATH, OUT_PATH } = options
  const csvCLResult = await parseCSVData(FILES_PATH.clover).catch(err => { throw err })
  let parsedCLData: CLEntity[] = clCSVtoCLEntity(csvCLResult)
  let parsedBCData= await parseCSVData(FILES_PATH.bigCommerce).catch(err => { throw err })

  interface NameResult { bgName: string, clName: string, bcRowId: number, similarity: number }
  let matchedRecords: CLEntity[] = []

  // console.log(stringSimilarity.compareTwoStrings("Blue Raspberry Gummy Bears [Size=32 oz.]", "Blue Raspberry Gummy Bears/2lbs"))

  for (let i = 0; i < parsedCLData.length; i++) {
    let nameResults: NameResult[] = []
    const clItem = parsedCLData[i]

    for (let j = 0; j < parsedBCData.length; j++) {
      let bcItem = parsedBCData[j] as any
      let bcName: string = "";
      let bcPrice: string = "";
      let bcSKU: string = "";

      for (const [key, value] of Object.entries(bcItem)) {
        if (key.trim() === BCFieldName['Product Name']) 
          bcName = value as any
        else if (key.trim() === BCFieldName['Price'])
          bcPrice = value as any
        else if (key.trim() === BCFieldName['Product Code/SKU'])
          bcSKU = value as any
      }

      console.log(bcName)

      const similarity = stringSimilarity.compareTwoStrings(clItem.clName + "", bcName + "")

      if (similarity > 0.60)
        if (Math.round(Number.parseFloat(clItem.price + '')) === Math.round(Number.parseFloat(`${bcName}`)))
          nameResults.push({ bcRowId: j, bgName: bcName, clName: clItem.clName + "", similarity })
    }

    // sort best match
    nameResults.sort((a, b) => b.similarity - a.similarity)

    // match found
    if (nameResults[0]) {
      const nameResult = nameResults[0]
      const bcItem = parsedBCData[nameResult.bcRowId] as any;
      
      // remove BC record, no repeat
      parsedBCData = removeAtIndex<CLEntity>(parsedBCData, nameResult.bcRowId)

      // remove CL record, no repeat
      parsedCLData = removeAtIndex(parsedCLData, i)

      matchedRecords.push({
        name: nameResult.bgName,
        clName: nameResult.clName,
        price: clItem.price,
        SKU: clItem.SKU,
        description: bcItem[BCFieldName['Product Description']],
        price_type: "Fixed",
        cost: 0,
        tax_rates: ['DEFAULT'],
        quantity: 0,
        category: bcItem[BCFieldName['Category']],
        clover_ID: clItem.clover_ID,
        bcSKU: bcItem[BCFieldName['Product Code/SKU']]
      })
    }
  }

  // merge matched with unmatched records
  const merged = [...matchedRecords, ...parsedCLData, ...parsedBCData]

  await writeCSV<CLEntity>(
    matchedRecords,
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
    OUT_PATH
  )

}

function clCSVtoCLEntity(parsedCSVData: any[]): CLEntity[] {
  let output: CLEntity[] = []
  parsedCSVData.forEach(item => {
    let obj: CLEntity = {
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
      clover_ID: item[CLFieldName["Clover ID"]],
      bcSKU: "",
    }
    for (const [key, value] of Object.entries(item)) {
      if (key.trim() === 'Clover ID') 
        obj.clover_ID = value as any
    }
    output.push(obj)
  })
  return output
}

mergeProducts({ OUT_PATH: `${__dirname}/merged.csv`, FILES_PATH: { bigCommerce: `${__dirname}/result.csv`, clover: `${__dirname}/source_data/clover-inventory.csv` } })
  .then(() => console.log("done"))
  .catch((e) => console.error(e))