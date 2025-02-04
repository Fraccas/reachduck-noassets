import { NetworkProvider, selectBlockchainNetwork } from "..";
import { getBlockchain } from "../storage";
import { NetworkData, ReachToken, ChainSymbol, NetworksMap } from "../types";
import ALGO from "./ALGO";

const CHAINS: Record<ChainSymbol, NetworkInterface> = {
  ALGO: makeAPI("ALGO", ALGO),
  ETH: makeAPI("ETH", {
    getProviderEnv() {
      return { ETH_NET: "ropsten" };
    },
  }),
};

/** Interface for blockchain-specific helpers */
export type NetworkInterface = {
  chain: ChainSymbol & string;
  /** Fetch account details from network */
  fetchAccount(acc: string | any): any | Promise<any>;
  /** Returns a blockchain-specific configuration for `stdlib` */
  getProviderEnv(provider?: NetworkProvider & string): any;
  /** Search for transactions for this `addr` */
  //searchForTransactions(addr: string, opts?: any): any;
};

export const NETWORKS: NetworksMap = {
  ALGO: { name: "Algorand", abbr: "ALGO", decimals: 6 },
  ETH: { name: "Ethereum", abbr: "ETH", decimals: 18 },
};

/** Get a UI-friendly list of supported Networks */
export function listSupportedNetworks(): NetworkData[] {
  const activeNetwork = getBlockchain();

  return Object.values(NETWORKS).map((val) => ({
    ...val,
    active: val.abbr === activeNetwork,
  }));
}

/**
 * Returns a `NetworkInterface` w/ additional chain-specific helpers.
 * Note: not all `network` options are accepted by all chains. Defaults
 * to "ALGO" + "TestNet" if no values are provided.
 */
export function createConnectorAPI(
  chain?: string & ChainSymbol,
  network?: NetworkProvider
): NetworkInterface {
  const key = (chain || getBlockchain()) as ChainSymbol;
  if (!CHAINS[key]) return makeAPI(key);
  if (network) {
    const net = network === "BetaNet" && chain !== "ALGO" ? "TestNet" : network;
    selectBlockchainNetwork(net);
  }
  return CHAINS[key];
}

export function isSupportedNetwork(key: ChainSymbol) {
  return Boolean(CHAINS[key]);
}

/**
 * Create a default `ConnectorInterface` object that can be overridden
 * with chain-specific functions
 */
function makeAPI(
  chain: string & ChainSymbol,
  overrides: Partial<NetworkInterface> = {}
): NetworkInterface {
  const emptyList = () => [];
  const unImpl = (m: string) => console.log(`Unsupported ${chain} call "${m}"`);

  return {
    chain,
    fetchAccount: () => unImpl("fetchAccount"),
    getProviderEnv: () => ({}),

    // override with any custom implementation
    ...overrides,
  };
}
