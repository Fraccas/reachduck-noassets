import * as T from "./types";
import { createConnectorAPI, NETWORKS } from "./networks/index.networks";
import { trimByteString, formatNumberShort } from "./utils/helpers";
import {
  getBlockchain,
  getBlockchainNetwork,
  selectBlockchain,
  selectBlockchainNetwork,
} from "./storage";

type LoadStdlibFn = { (args: any): any };

const UNINSTANTIATED = `
QUACK! ReachStdlib is not instantiated. See "@jackcom/reachduck" docs for info.
`;
/**
 * @reach_helper `StdLib` instance */
let reach: T.ReachStdLib;

/**
 * @reach_helper
 * Global default reach object */
export function createReachAPI() {
  if (!reach) throw new Error(UNINSTANTIATED);
  return reach;
}

/**
 * @reach_helper
 * Check if an account has opted in to a token. Probably `noOp` outside Algorand */
export async function checkHasToken(acc: T.ReachAccount, token: any) {
  return (await acc.tokenAccepted(token)) || Promise.resolve(false);
}

/**
 * @reach_helper
 * Format address for `networkAccount` instance */
export function formatAddress(acc: T.ReachAccount) {
  return createReachAPI().formatAddress(acc.getAddress());
}

/**
 * @reach_helper
 * Optionally-abbreviated currency formatter (e.g. `fn(1000)` -> `1000` || `1K` ). Expects `amt` to be in atomic unit for network */
export function formatCurrency(amt: any, decs?: number, abbr = false): string {
  const { formatWithDecimals } = createReachAPI();
  const decimals = parseNetworkDecimals(Number(decs));
  const reachFmt = formatWithDecimals(amt, decimals);
  return abbr ? formatNumberShort(reachFmt) : reachFmt;
}

/**
 * @reach_helper
 * Optionally opt-in in to assets */
export async function optInToAsset(acc: T.ReachAccount, tokenId: any) {
  if (await acc.tokenAccepted(tokenId)) return Promise.resolve(true);

  return acc
    .tokenAccept(tokenId)
    .then(() => true)
    .catch(() => false);
}

/**
 * @reach_helper
 * Initialize the stdlib instance. Note: If you want to use
 * a wallet fallback (any browser or other client wallet), use `loadReachWithOpts`
 * insrtead
 */
export function loadReach(
  loadStdlibFn: LoadStdlibFn,
  chain: T.ChainSymbol = getBlockchain(),
  network: T.NetworkProvider = getBlockchainNetwork()
) {
  if (reach?.connector) return reach;

  // Instantiate Reach object
  void reachEnvironment(chain, network);
  reach = loadStdlibFn(chain);
  reach.setProviderByName(network);

  return reach;
}

/**
 * @reach_helper
 *
 * @reach_helper
 * Initialize the stdlib instance with an environment override and
 * (optional) wallet fallback.
 */
export function loadReachWithOpts(
  loadStdlibFn: LoadStdlibFn,
  opts: ReachEnvOpts
) {
  if (reach?.connector) return reach;

  // Instantiate Reach object
  const { chain = "ALGO", network = "TestNet" } = opts;
  const REACH_CONNECTOR_MODE = chain || getBlockchain();
  const providerEnv = {
    ...reachEnvironment(REACH_CONNECTOR_MODE, network),
    ...(opts.providerEnv || {}),
  };
  reach = loadStdlibFn({ REACH_CONNECTOR_MODE });
  if (opts.walletFallback) {
    reach.setWalletFallback(
      reach.walletFallback({
        ...opts.walletFallback,
        providerEnv,
      })
    );
  } else reach.setProviderByEnv(providerEnv);

  return reach;
}

/**
 * @internal
 * Store environment variables for `stdlib` instance, and create
 * a `connectorAPI` for talking to the selected blockchain
 */
function reachEnvironment(
  chain: T.ChainSymbol & string,
  network: T.NetworkProvider & string,
  providerEnv?: any
) {
  void selectBlockchain(chain);
  void selectBlockchainNetwork(network);

  if (providerEnv) return providerEnv;

  const connector = createConnectorAPI(chain);
  return connector.getProviderEnv(network);
}

export type ReachEnvOpts = {
  chain?: T.ChainSymbol & string;
  network?: T.NetworkProvider & string;
  providerEnv?: any;
  walletFallback?: {
    MyAlgoConnect?: any;
    WalletConnect?: any;
  };
};

/**
 * Parses a contract address for Algorand or other chains
 * @param {string|number} addr string|number contract address
 * @returns string|number contract address
 */
export function parseAddress(ctc: any) {
  const { isBigNumber, bigNumberToNumber } = createReachAPI();
  const addr = isBigNumber(ctc) ? bigNumberToNumber(ctc) : ctc;
  if (reach.connector === "ALGO") return parseInt(addr);

  const pit = addr.toString().trim().replace(/\0.*$/g, "");
  return pit.startsWith("0x") ? pit : `0x${pit}`;
}

/**
 * @reach_helper
 * Convert `val` to atomic units for the current network */
export function parseCurrency(val: any, dec?: number) {
  const decimals = parseNetworkDecimals(Number(dec));
  return createReachAPI().parseCurrency(val, decimals);
}

/* INTERNAL */

// HELPER | cancel request if it takes too long
export async function withTimeout<T>(
  request: Promise<T> | (() => Promise<T>),
  fallback = null,
  timeout = 3500
): Promise<T | null> {
  return new Promise(async (resolve) => {
    const call = typeof request === "function";
    const cancel = () => resolve(fallback);
    setTimeout(cancel, timeout);
    const d = call ? await request() : await request;

    resolve(d);
  });
}

/**
 * @reach_helper
 * Format token metadata from `tokenMetadata` API request */
function formatReachToken(tokenId: any, amount: any, data: any): T.ReachToken {
  const id = parseAddress(tokenId);
  const fallbackName = `Asset #${id}`;
  const symbol = data.symbol ? trimByteString(data.symbol) : `#${id}`;

  return {
    id: parseAddress(tokenId),
    name: trimByteString(data.name) || fallbackName,
    symbol,
    url: trimByteString(data.url),
    amount,
    supply: data.supply,
    decimals: data.decimals,
    verified: data.verified || false,
  };
}

function parseNetworkDecimals(decimals?: number) {
  const key = createReachAPI().connector as T.ChainSymbol;
  return isNaN(Number(decimals)) ? NETWORKS[key].decimals || 0 : decimals;
}
