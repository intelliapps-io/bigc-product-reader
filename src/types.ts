/**
 * BigCommerce 
 */
 export enum BCItemType {
  "Product" = "Product",
  "SKU" = "SKU",
  "Rule" = "Rule",
}

export enum BCFieldName {
  "Item Type" = "Item Type",
  "Product ID" = "Product ID",
  "Product Name" = "Product Name",
  "Product Type" = "Product Type",
  "Product Code/SKU" = "Product Code/SKU",
  "Bin Picking Number" = "Bin Picking Number",
  "Brand Name" = "Brand Name",
  "Option Set" = "Option Set",
  "Option Set Align" = "Option Set Align",
  "Product Description" = "Product Description",
  "Price" = "Price",
  "Cost Price" = "Cost Price",
  "Retail Price" = "Retail Price",
  "Sale Price" = "Sale Price",
  "Fixed Shipping Cost" = "Fixed Shipping Cost",
  "Free Shipping" = "Free Shipping",
  "Product Warranty" = "Product Warranty",
  "Product Weight" = "Product Weight",
  "Product Width" = "Product Width",
  "Product Height" = "Product Height",
  "Product Depth" = "Product Depth",
  "Allow Purchases?" = "Allow Purchases?",
  "Product Visible?" = "Product Visible?",
  "Product Availability" = "Product Availability",
  "Track Inventory" = "Track Inventory",
  "Current Stock Level" = "Current Stock Level",
  "Low Stock Level" = "Low Stock Level",
  "Category" = "Category",
  "Product Image ID - 1" = "Product Image ID - 1",
  "Product Image File - 1" = "Product Image File - 1",
  "Product Image Description - 1" = "Product Image Description - 1",
  "Product Image Is Thumbnail - 1" = "Product Image Is Thumbnail - 1",
  "Product Image Sort - 1" = "Product Image Sort - 1",
  "Product Image ID - 2" = "Product Image ID - 2",
  "Product Image File - 2" = "Product Image File - 2",
  "Product Image Description - 2" = "Product Image Description - 2",
  "Product Image Is Thumbnail - 2" = "Product Image Is Thumbnail - 2",
  "Product Image Sort - 2" = "Product Image Sort - 2",
  "Search Keywords" = "Search Keywords",
  "Page Title" = "Page Title",
  "Meta Keywords" = "Meta Keywords",
  "Meta Description" = "Meta Description",
  "Product Condition" = "Product Condition",
  "Show Product Condition?" = "Show Product Condition?",
  "Sort Order" = "Sort Order",
  "Product Tax Class" = "Product Tax Class",
  "Product UPC/EAN" = "Product UPC/EAN",
  "Stop Processing Rules" = "Stop Processing Rules",
  "Product URL" = "Product URL",
  "Redirect Old URL?" = "Redirect Old URL?",
  "GPS Global Trade Item Number" = "GPS Global Trade Item Number",
  "GPS Manufacturer Part Number" = "GPS Manufacturer Part Number",
  "GPS Gender" = "GPS Gender",
  "GPS Age Group" = "GPS Age Group",
  "GPS Color" = "GPS Color",
  "GPS Size" = "GPS Size",
  "GPS Material" = "GPS Material",
  "GPS Pattern" = "GPS Pattern",
  "GPS Item Group ID" = "GPS Item Group ID",
  "GPS Category" = "GPS Category",
  "GPS Enabled" = "GPS Enabled",
  "Tax Provider Tax Code" = "Tax Provider Tax Code",
  "Product Custom Fields" = "Product Custom Fields",
}

/**
 * Clover Field Name
 */
export enum CLFieldName {
  "Clover ID" = "Clover ID",
  "Name" = "Name",
  "Price" = "Price",
  "Price Type" = "Price Type",
  "Price Unit" = "Price Unit",
  "Tax Rates" = "Tax Rates",
  "Cost" = "Cost",
  "Product Code" = "Product Code",
  "SKU" = "SKU",
  "Modifier Groups" = "Modifier Groups",
  "Quantity" = "Quantity",
  "Labels" = "Labels",
  "Hidden" = "Hidden",
  "Non-revenue item" = "Non-revenue item",
}

export interface CLEntity {
  name: string
  price: number
  price_type: string
  tax_rates: string[]
  cost: number
  SKU: string
  quantity: number
  clName?: string
  bcSKU?: string
  clover_ID?: string
  price_unit?: string
  description?: string
  product_code?: string
  category?: string
}