/**
 * @OnlyCurrentDoc
 */
/*=======================================================================================================================*
  Cosmos directory for google sheets by Josh_Lopes (Tedcrypto.io) and Tom (Eco-stake)
  =======================================================================================================================*
  Version:      0.0.1
  Project Page: https://github.com/TedCryptoOrg/cosmos-google-tools
  Copyright:    (c) 2022 by Josh_Lopes (Tedcrypto.io) and Tom (Eco-stake)
  License:      MIT License
  ------------------------------------------------------------------------------------------------------------------------
  A library for importing blockchain data endpoints into Google spreadsheets. Functions include:
    COSMOSDIRECTORYAPR                 Retrieve blockchain APR
    COSMOSDIRECTORYBALANCE             Retrieve blockchain wallet balance
    COSMOSDIRECTORYTOTALDELEGATIONS    Retrieve blockchain validator total delegations
    COSMOSDIRECTORYVALCOMMISSION       Retrieve blockchain validator commission

  For bug reports see https://github.com/TedCryptoOrg/cosmos-google-tools/issues
  ----------------------------------------------------------------------------------------------------------------------------
  Changelog:

  0.0.1   27/09/22 Release
  *========================================================================================================================*/

/*-------------------------------------------- GOOGLE SHEET FORMULA USERINTERFACE -------------------------------- */

function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('Cosmos Directory')
        .addItem('About Us', 'ShowAboutUs')
        .addToUi();
}

function ShowAboutUs() {
    const ui = SpreadsheetApp.getUi();
    ui.alert(
        "Contact Us",
        'App created by Josh_Lopes (Tedcrypto.io) and Tom (Eco-stake).' +
        '\n If you have any issues please open an issue here: \n\n https://github.com/TedCryptoOrg/cosmos-google-tools/issues',
        ui.ButtonSet.OK
    )
}

/**COSMOSDIRECTORYAPR
 * Returns blockchain current APR.
 *
 *   =COSMOSDIRECTORYAPR("juno")
 *
 * @param {string} chain
 *
 * @return {float} Chain APR percentage
 */
async function COSMOSDIRECTORYAPR(chain) {
    const chainData = await get_chain_data(chain);
    if (chainData?.params?.hasOwnProperty('calculated_apr')) {
        return (chainData.params.calculated_apr * 100).toFixed(2);
    }

    return 0;
}

/**COSMOSDIRECTORYBALANCE
 * Returns cryptocurrency balances into Google spreadsheets.
 *
 *   =COSMOSDIRECTORYBALANCE("juno", "juno1ytr0nujljr44t7kw2vhe566ecjz8mtn99c10pc")
 *   =COSMOSDIRECTORYBALANCE("juno", "juno1nsnhn0y0vsjq8j70z6yfxp2xk4rsjrzmn04g4h", "juno")
 *
 * @param {string} chain
 * @param {string} walletAddress
 * @param {string|null} token
 *
 * @return {array|float} If token is given it will return amount of the balance
 */
async function COSMOSDIRECTORYBALANCE(chain, walletAddress, token) {
    const url = `https://rest.cosmos.directory/${chain}/cosmos/bank/v1beta1/balances/${walletAddress}`;
    const res = await UrlFetchApp.fetch(url);
    const data = JSON.parse(res.getContentText());
    if (!data?.balances) {
        console.error('Failed to fetch wallet balance', url);
        throw new Error('Failed to fetch wallet balance');
    }

    if (token) {
        const tokenData = data.balances.find((item) => item.denom === token);
        return tokenData ? tokenData.amount : 0;
    }

    return data.balances;
}

/**COSMOSDIRECTORYTOTALDELEGATIONS
 * Gets validator total delegations (VP)
 *
 *   =COSMOSDIRECTORYTOTALDELEGATIONS("juno", "junovaloper14xmyp2hdd586frvl0d5mpqy5j9rjkt4khdp5hd")
 *
 * @param {string} chain
 * @param {string} valoper Validator address
 *
 * @return {float} Number of tokens
 */
async function COSMOSDIRECTORYTOTALDELEGATIONS(chain, valoper) {
    const validator = await get_validator(chain, valoper);

    return validator.tokens;
}

/**COSMOSDIRECTORYVALCOMMISSION
 * Returns current validator commission
 *
 *   =COSMOSDIRECTORYVALCOMMISSION("juno", "junovaloper14xmyp2hdd586frvl0d5mpqy5j9rjkt4khdp5hd")
 *
 * @param {string} chain
 * @param {string} valoper Validator address
 *
 * @return {float} Chain APR percentage
 */
async function COSMOSDIRECTORYVALCOMMISSION(chain, valoper) {
    const validatorData = await get_validator(chain, valoper);

    return (validatorData.commission.rate * 100).toFixed(2);
}

/**
 * Get the chain data from cosmos directory
 *
 * @param {string} chain
 *
 * @return array
 */
async function get_chain_data(chain) {
    return with_cache(chain, async () => {
        const url = `https://chains.cosmos.directory/${chain}`;
        const res = await UrlFetchApp.fetch(url);
        const data = JSON.parse(res.getContentText());
        if (!data?.chain) {
            console.error('Failed to fetch chain', url);
            throw new Error('Failed to fetch chain');
        }

        return data.chain;
    }, 60 * 5)
}

/**
 * Get the validator data from cosmos directory
 *
 * @param {string} chain
 * @param {string} valoper Validator address
 *
 * @return array
 */
async function get_validator(chain, valoper) {
    return with_cache(valoper, async () => {
        const url = `https://validators.cosmos.directory/chains/${chain}/${valoper}`;
        const res = await UrlFetchApp.fetch(url);
        const data = JSON.parse(res.getContentText());
        if (!data?.validator) {
            console.error('Failed to fetch validator', url);
            throw new Error('Failed to fetch validator');
        }
        return data.validator
    }, 60 * 5)
}

async function with_cache(key, getData, timeout) {
    let cache = CacheService.getScriptCache();
    let data = JSON.parse(cache.get(key))
    if (!data) {
        data = await getData()
        cache.put(key, JSON.stringify(data), timeout)
    }
    return data;
}

async function test() {
    console.log(await COSMOSDIRECTORYAPR("juno"));
    //console.log(await get_validator("juno", "junovaloper14xmyp2hdd586frvl0d5mpqy5j9rjkt4khdp5hd"));
}