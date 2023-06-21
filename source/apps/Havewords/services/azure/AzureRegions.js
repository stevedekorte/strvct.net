AzureService.shared().setRegionOptions([
  // regions that support intonation features
  ["Asia", "Southeast Asia", "southeastasia"],
  ["Australia", "Australia East", "australiaeast"],
  ["Europe", "North Europe", "northeurope"],
  ["Europe", "West Europe", "westeurope"],
  ["North America", "East US", "eastus"],
  ["North America", "East US 2", "eastus2"],
  ["North America", "South Central US", "southcentralus"],
  ["North America", "West Central US", "westcentralus"],
  ["North America", "West US", "westus"],
  ["North America", "West US 2", "westus2"],
  ["South America", "Brazil South", "brazilsouth"],
].map(entry => entry[2])); // only return the values (the 3rd item in each entry)