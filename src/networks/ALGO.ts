import {
  fetchAccount,
  getProviderEnv
} from "./ALGO.indexer";

export const AlgoInterface = {
  fetchAccount: getAccount,
  getProviderEnv
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
