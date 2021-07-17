import fs from 'fs'
import parse from 'csv-parse'
import { BCFieldName, BCItemType, CLEntity, CLFieldName } from './types'
import { parseCSVData } from './helpers'
import { jaro_winkler } from './jarowinkler'

/** Entry */
async function main() {
  const FILES_PATH = { bigCommerce: `${__dirname}/result.csv`, clover: `${__dirname}/source_data/clover-inventory.csv` }
  const parsedBCData = await parseCSVData(FILES_PATH.bigCommerce).catch(err => { throw err })
  const parsedCLData = await parseCSVData(FILES_PATH.clover).catch(err => { throw err })

  interface NameResult { bgName: string, clName: string, bcRowId: number, similarity: number }
  let matched: NameResult[] = []

  console.log(jaro_winkler.distance("Blue Raspberry Gummy Bears [Size=32 oz.]", "Blue Raspberry Gummy Bears/2lbs"))

  for (let i = 0; i < parsedCLData.length; i++) {
    let nameResults: NameResult[] = []
    const clItem = parsedCLData[i] as any
    const clName = clItem[CLFieldName['Name']]
    const clPrice = clItem[CLFieldName['Price']]

    for (let j = 0; j < parsedBCData.length; j++) {
      const bcItem = parsedBCData[j] as CLEntity
      const similarity = jaro_winkler.distance(clName, bcItem["name"]);
      if (similarity > 0.80 && Number.parseFloat(clPrice) === Number.parseFloat(`${bcItem.price}`))
        nameResults.push({ bcRowId: j, bgName: bcItem["name"], clName, similarity })
    }

    nameResults.sort((a, b) => b.similarity - a.similarity)

    matched.push(nameResults[0])
  }

  console.log(matched)

}

main()
  .then(() => console.log("done"))
  .catch((e) => console.error(e))