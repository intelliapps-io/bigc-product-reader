import fs from 'fs'
import { BCFieldName, BCItemType, CLEntity, CLFieldName } from './types'
import { readCSV, removeAtIndex, writeCSV } from './helpers'
import * as stringSimilarity from 'string-similarity';

interface NameResult {
  bcName: string,
  clName: string,
  bcRowId: number,
  clRowId: number,
  similarity: number
}

/**
 * Merge Products
 * @param options 
 * @returns 
 */
export function mergeProducts(options: {
  bc_products: CLEntity[],
  cl_products: CLEntity[]
}): CLEntity[] {
  let { bc_products, cl_products } = options
  let matchedRecords: CLEntity[] = []

  // match products
  for (let i = 0; i < cl_products.length; i++) {
    const clItem = cl_products[i]
    let nameResults: NameResult[] = []

    // find matches
    for (let j = 0; j < bc_products.length; j++) {
      const bcItem = bc_products[j]
      const similarity = stringSimilarity.compareTwoStrings(clItem.name + '', bcItem.name + '')

      if (similarity > 0.60)
        if (Number.parseFloat(clItem.price + '') === Number.parseFloat(bcItem.price + ''))
          nameResults.push({ bcRowId: j, bcName: bcItem.name, clRowId: i, clName: clItem.name, similarity })
    }

    // sort best match
    nameResults.sort((a, b) => b.similarity - a.similarity)

    // match fpind
    if (nameResults[0]) {
      const nameResult = nameResults[0]
      const bcItem = bc_products[nameResult.bcRowId]

      // remove matched records, no repeat
      bc_products = removeAtIndex(bc_products, nameResult.bcRowId)
      cl_products = removeAtIndex(cl_products, nameResult.clRowId)

      // save result
      matchedRecords.push({
        name: bcItem.name,
        price: clItem.price,
        SKU: clItem.SKU ? clItem.SKU : bcItem.SKU,
        description: "",
        price_type: clItem.price_type,
        cost: clItem.cost,
        tax_rates: clItem.tax_rates,
        quantity: clItem.quantity,
        category: bcItem.category,
        clover_ID: clItem.clover_ID,
        clName: clItem.clName,
        bcSKU: bcItem.SKU,
        price_unit: clItem.price_unit,
        product_code: ""
      })
    }
  }

  console.log(cl_products.length)

  const merged = [...matchedRecords, ...cl_products, ...bc_products]
  return merged
}