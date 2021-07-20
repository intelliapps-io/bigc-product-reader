import fs from 'fs'
import parse from 'csv-parse'
import { BCFieldName, BCItemType, CLEntity } from './types'
import { readCSV, writeCSV } from './helpers'