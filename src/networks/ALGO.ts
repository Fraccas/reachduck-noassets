import {
  fetchAccount,
  getProviderEnv,
  searchForTransactions
} from "./ALGO.indexer";

export const AlgoInterface = {
  fetchAccount: getAccount,
  getProviderEnv,
  searchForTransactions,
};

export default AlgoInterface;

/** Fetch account details (assets) */
async function getAccount(address: string): Promise<any> {
  const { account } = await fetchAccount(address);
  return account;
}

/** Load account assets */
async function loadAssets(addr: string) {
  return null;
}
