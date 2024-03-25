/**
 * @OnlyCurrentDoc
 */
/*=======================================================================================================================*
  Cosmos directory for google sheets by Josh_Lopes (Tedcrypto.io) and Tom (Eco-stake)
  =======================================================================================================================*
  Version:      0.0.4
  Project Page: https://github.com/TedCryptoOrg/cosmos-google-tools
  Copyright:    (c) 2023 by Josh_Lopes (Tedcrypto.io) and Tom (Eco-stake)
  License:      MIT License
  ------------------------------------------------------------------------------------------------------------------------
  A library for importing blockchain data endpoints into Google spreadsheets. Functions include:
    COSMOSDIRECTORYAPR                 Retrieve blockchain APR
    COSMOSDIRECTORYBALANCE             Retrieve blockchain wallet balance
    COSMOSDIRECTORYTOTALDELEGATIONS    Retrieve blockchain validator total delegations
    COSMOSDIRECTORYVALCOMMISSION       Retrieve blockchain validator commission
    COSMOSDIRECTORYCHAINPRICE          Retrieve blockchain validator commission

  For bug reports see https://github.com/TedCryptoOrg/cosmos-google-tools/issues
  ----------------------------------------------------------------------------------------------------------------------------
  Changelog:

  0.0.4   25/03/24 Fixed humaise vs humanize
  0.0.3   17/07/23 Added Cosmos Directory chain price
  0.0.2   x        Added cache system
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

/**
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

/**
 * Returns cryptocurrency balances into Google spreadsheets.
 *
 *   =COSMOSDIRECTORYBALANCE("juno", "juno1ytr0nujljr44t7kw2vhe566ecjz8mtn99c10pc")
 *   =COSMOSDIRECTORYBALANCE("juno", "juno1nsnhn0y0vsjq8j70z6yfxp2xk4rsjrzmn04g4h", "juno")
 *
 * @param {string} chain
 * @param {string} walletAddress
 * @param {string|null} token
 * @param {boolean} humanize
 *
 * @return {array|float} If token is given it will return amount of the balance
 */
async function COSMOSDIRECTORYBALANCE(chain, walletAddress, token, humanize = false) {
    const url = `https://rest.cosmos.directory/${chain}/cosmos/bank/v1beta1/balances/${walletAddress}`;
    const res = await UrlFetchApp.fetch(url);
    const data = JSON.parse(res.getContentText());
    if (!data?.balances) {
        console.error('Failed to fetch wallet balance', url);
        throw new Error('Failed to fetch wallet balance');
    }

    if (token) {
        const tokenData = data.balances.find((item) => item.denom === token);
        return tokenData ? (humanize ? humanize_token_value(chain, tokenData.amount) : tokenData.amount): 0;
    }

    return humanize ? humanize_token_value(chain, data.balances) : data.balances;
}

/**
 * Gets validator total delegations (VP)
 *
 *   =COSMOSDIRECTORYTOTALDELEGATIONS("juno", "junovaloper14xmyp2hdd586frvl0d5mpqy5j9rjkt4khdp5hd")
 *
 * @param {string} chain
 * @param {string} valoper Validator address
 * @param {boolean} humanize
 *
 * @return {float} Number of tokens
 */
async function COSMOSDIRECTORYTOTALDELEGATIONS(chain, valoper, humanize = false) {
    const validator = await get_validator(chain, valoper);

    return humanize ? humanize_token_value(chain, validator.tokens) : validator.tokens;
}

/**
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
 * Returns current chain price
 *
 *   =COSMOSDIRECTORYCHAINPRICE("juno"")
 *   =COSMOSDIRECTORYCHAINPRICE("juno", "coingecko")
 *
 * @param {string} chain
 * @param {string} dex
 *
 * @return {float} Chain price
 */
async function COSMOSDIRECTORYCHAINPRICE(chain, dex = undefined) {
    const chainData = await get_chain_data(chain);

    return chainData.prices[dex ?? 'coingecko'][chainData.display].usd;
}

/**
 * Get the chain data from cosmos directory
 *
 * @param {string} chain
 *
 * @return {Promise<array>}
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
 * @return {Promise<array>}
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

/**
 * Get the data from cache or fetch it from a callback function
 *
 * @param {string} key Cache key name
 * @param {function} getData Closure function to fetch data
 * @param {int} timeout Timeout in seconds
 *
 * @returns {Promise<any>}
 */
async function with_cache(key, getData, timeout) {
    let cache = CacheService.getScriptCache();
    let data = JSON.parse(cache.get(key))
    if (!data) {
        data = await getData()
        cache.put(key, JSON.stringify(data), timeout)
    }

    return data;
}

/**
 * Using chain exponent, normalises the tokens from utoken to token denomination
 * e.g.: 1000000uatom = 1atom
 *
 * @param {string} chain
 * @param {string} token
 *
 * @returns {Promise<number>}
 */
async function humanize_token_value(chain, token) {
    const chainData = await get_chain_data(chain);
    const exponent = Math.pow(10, chainData?.decimals);

    return token / exponent;
}
