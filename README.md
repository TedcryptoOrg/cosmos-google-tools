# Cosmos google tools

This have simple functions that will allow you to query blockchains using google app scripts.

## Install

Copy the `cosmos_directory.gs` file content to your google app script project. (Extensions > Apps Script)

## Usage

Once the script is installed you will see a new menu "Cosmos directory". That means your script was successfully
installed, and you can now use the following functions.

| Function                        | Description                                     |
|---------------------------------|-------------------------------------------------|
| COSMOSDIRECTORYAPR              | Retrieve blockchain APR                         |
| COSMOSDIRECTORYBALANCE          | Retrieve blockchain wallet balance              |
| COSMOSDIRECTORYTOTALDELEGATIONS | Retrieve blockchain validator total delegations | 
| COSMOSDIRECTORYVALCOMMISSION    | Retrieve blockchain validator commission        |

If a function returns utokens, you can also send `humanize` argument as true to have its value converted to
chain default denomination. E.g.: `COSMOSDIRECTORYBALANCE("cosmoshub", "cosmos1...", "atom", true)`

## Example

https://docs.google.com/spreadsheets/d/16W4HHXb8JroFl9yasuJN3xNiyDj3yICAr5fYDR7-OYk/edit?usp=sharing