import { Coins, ShieldCheck, Sparkles, Wallet as WalletIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TopNavbar } from "../components/TopNavbar";
import { readJsonSafe } from "../utils/http";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};

const STABLE_CHAIN_ID_DEC = 988;
const STABLE_CHAIN_ID_HEX = "0x3dc";
const AUTH_TOKEN_KEY = "voxelverseAuthToken";
const WALLET_ADDRESS_KEY = "voxelverseWalletAddress";

const STABLE_NETWORK_PARAMS = {
  chainId: STABLE_CHAIN_ID_HEX,
  chainName: "Stable Mainnet",
  nativeCurrency: {
    name: "USDT0",
    symbol: "USDT0",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.stable.xyz"],
  blockExplorerUrls: ["https://stablescan.xyz"],
};

function getProvider(): Eip1193Provider | null {
  const maybeEthereum = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
  return maybeEthereum ?? null;
}

function shortAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainIdHex, setChainIdHex] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [playerExp, setPlayerExp] = useState<number>(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState<string>("0");
  const [withdrawExpInput, setWithdrawExpInput] = useState("1000");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isOnStable = useMemo(() => {
    if (!chainIdHex) return false;
    return parseInt(chainIdHex, 16) === STABLE_CHAIN_ID_DEC;
  }, [chainIdHex]);

  const withdrawPreviewUsdt0 = useMemo(() => {
    const value = Number(withdrawExpInput);
    if (!Number.isFinite(value) || value <= 0) return "0.0";
    return (value / 10000).toFixed(4);
  }, [withdrawExpInput]);
  const expToRedeem = Number(withdrawExpInput);
  const canWithdraw =
    Number.isInteger(expToRedeem) &&
    expToRedeem >= 1000 &&
    expToRedeem % 1000 === 0 &&
    playerExp >= expToRedeem;

  useEffect(() => {
    const syncFromStorage = () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const address = localStorage.getItem(WALLET_ADDRESS_KEY);
      setAuthToken(token);
      setWalletAddress(address);
    };

    syncFromStorage();
    window.addEventListener("wallet-auth-updated", syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener("wallet-auth-updated", syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!authToken) return;
      try {
        const response = await fetch("/api/player/me", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await readJsonSafe<{
          walletAddress: string;
          exp: number;
          totalUsdt0Withdrawn: string;
        }>(response);
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(WALLET_ADDRESS_KEY);
            setAuthToken(null);
            setWalletAddress(null);
          }
          return;
        }
        if (!data.walletAddress || typeof data.exp !== "number") {
          throw new Error("Player profile response was empty.");
        }
        setWalletAddress(data.walletAddress);
        setPlayerExp(data.exp);
        setTotalWithdrawn(data.totalUsdt0Withdrawn ?? "0");
      } catch {
        setErrorMessage("Could not load wallet profile from server.");
      }
    };

    void loadProfile();
  }, [authToken]);

  const connectStableWallet = async () => {
    const provider = getProvider();
    if (!provider) {
      setErrorMessage("No wallet found. Install MetaMask or another EVM wallet.");
      return;
    }

    setErrorMessage(null);
    setWithdrawResult(null);
    setIsConnecting(true);
    try {
      const currentChainUnknown = await provider.request({ method: "eth_chainId" });
      const currentChain = typeof currentChainUnknown === "string" ? currentChainUnknown : null;

      if (currentChain !== STABLE_CHAIN_ID_HEX) {
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: STABLE_CHAIN_ID_HEX }],
          });
        } catch {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [STABLE_NETWORK_PARAMS],
          });
        }
      }

      const accountsUnknown = await provider.request({ method: "eth_requestAccounts" });
      const accounts = Array.isArray(accountsUnknown)
        ? accountsUnknown.filter((value): value is string => typeof value === "string")
        : [];
      const selected = accounts[0] ?? null;
      if (!selected) {
        setErrorMessage("No wallet account selected.");
        return;
      }
      setWalletAddress(selected);

      const activeChainUnknown = await provider.request({ method: "eth_chainId" });
      const activeChain = typeof activeChainUnknown === "string" ? activeChainUnknown : null;
      setChainIdHex(activeChain);

      const nonceResponse = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: selected }),
      });
      const noncePayload = await readJsonSafe<{ error?: string; message?: string }>(nonceResponse);
      if (!nonceResponse.ok) {
        throw new Error(noncePayload.error ?? "Failed to request login nonce.");
      }
      if (!noncePayload.message) throw new Error("Auth nonce response was empty.");

      let signatureUnknown: unknown;
      try {
        signatureUnknown = await provider.request({
          method: "personal_sign",
          params: [noncePayload.message, selected],
        });
      } catch {
        signatureUnknown = await provider.request({
          method: "personal_sign",
          params: [selected, noncePayload.message],
        });
      }
      if (typeof signatureUnknown !== "string") throw new Error("Wallet signature failed.");

      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: selected, signature: signatureUnknown }),
      });
      const verifyPayload = await readJsonSafe<{
        error?: string;
        token?: string;
        player?: { walletAddress?: string; exp?: number; totalUsdt0Withdrawn?: string };
      }>(verifyResponse);
      if (!verifyResponse.ok) {
        throw new Error(verifyPayload.error ?? "Wallet authentication failed.");
      }
      if (!verifyPayload.token || !verifyPayload.player?.walletAddress) {
        throw new Error("Wallet auth response was empty.");
      }
      localStorage.setItem(AUTH_TOKEN_KEY, verifyPayload.token);
      localStorage.setItem(WALLET_ADDRESS_KEY, verifyPayload.player.walletAddress);
      window.dispatchEvent(new Event("wallet-auth-updated"));
      setAuthToken(verifyPayload.token);
      setWalletAddress(verifyPayload.player.walletAddress);
      setPlayerExp(verifyPayload.player.exp ?? 0);
      setTotalWithdrawn(verifyPayload.player.totalUsdt0Withdrawn ?? "0");
    } catch (err) {
      const rawMessage =
        err instanceof Error ? err.message : "Could not connect wallet to Stable Mainnet.";
      const message =
        rawMessage.toLowerCase().includes("failed to fetch")
          ? "Backend API is offline. Start it with: npm run server"
          : rawMessage;
      setErrorMessage(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const withdrawRewards = async () => {
    if (!authToken) {
      setErrorMessage("Connect your wallet first.");
      return;
    }

    if (!Number.isInteger(expToRedeem) || expToRedeem < 1000 || expToRedeem % 1000 !== 0) {
      setErrorMessage("EXP must be a whole number, at least 1000, and divisible by 1000.");
      return;
    }

    setErrorMessage(null);
    setWithdrawResult(null);
    setIsWithdrawing(true);
    try {
      const response = await fetch("/api/player/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ expToRedeem }),
      });

      const payload = await readJsonSafe<{
        error?: string;
        txHash?: string;
        usdt0Sent?: string;
        expRemaining?: number;
        totalUsdt0Withdrawn?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Withdraw failed.");
      }

      setPlayerExp(payload.expRemaining ?? playerExp);
      setTotalWithdrawn(payload.totalUsdt0Withdrawn ?? totalWithdrawn);
      setWithdrawResult(
        `Sent ${payload.usdt0Sent} USDT0. Tx: ${payload.txHash}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Withdraw failed.";
      setErrorMessage(message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const isConnected = Boolean(walletAddress && authToken);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <img
        src="/map.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-black/75" />

      <TopNavbar floating={true} />

      <section className="relative z-20 px-5 pb-10 pt-32 sm:px-8 sm:pt-36">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-black/35 p-6 text-slate-100 backdrop-blur-xl sm:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-black tracking-wide sm:text-4xl">Wallet</h1>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/35 backdrop-blur-xl">
              <div className="relative border-b border-white/10 bg-gradient-to-r from-emerald-500/20 via-sky-500/10 to-amber-400/15 px-5 py-5 sm:px-6">
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute -right-10 top-0 h-28 w-28 rounded-full bg-emerald-400/20 blur-3xl" />
                  <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-sky-400/20 blur-3xl" />
                </div>
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-emerald-200">
                      <Sparkles size={14} />
                      Stable Rewards Vault
                    </div>
                    <p className="max-w-2xl text-sm text-slate-200 sm:text-base">
                      Link your Stable Mainnet wallet, keep your EXP tied to your address, and convert your progress into USDT0 rewards.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-right shadow-xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      Conversion Rate
                    </p>
                    <p className="mt-1 text-lg font-black text-amber-300">1000 EXP = 0.1 USDT0</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Wallet</p>
                    <WalletIcon size={18} className="text-amber-300" />
                  </div>
                  <p className="mt-3 text-lg font-black text-white">
                    {walletAddress ? shortAddress(walletAddress) : "Not connected"}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {walletAddress
                      ? "Your progress is mapped to this wallet."
                      : "Connect to unlock play and sync EXP."}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Network</p>
                    <ShieldCheck size={18} className="text-emerald-300" />
                  </div>
                  <p className="mt-3 text-lg font-black text-white">
                    {isOnStable ? "Stable Mainnet" : "Network check needed"}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {isOnStable ? "USDT0 rewards are enabled." : "Switch to Stable Mainnet to use rewards."}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Rewards Bank</p>
                    <Coins size={18} className="text-sky-300" />
                  </div>
                  <p className="mt-3 text-lg font-black text-white">{totalWithdrawn} USDT0</p>
                  <p className="mt-2 text-sm text-slate-300">Total rewards already claimed from your EXP.</p>
                </div>
              </div>
            </div>

            {!isConnected && (
              <button
                className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-slate-950 hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                onClick={connectStableWallet}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect Stable Wallet"}
              </button>
            )}

            <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
              <div className="rounded-[28px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Stored EXP</p>
                    <p className="mt-2 text-4xl font-black text-white sm:text-5xl">{playerExp}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-300/15 bg-amber-400/10 px-3 py-2 text-right">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Payout Ready</p>
                    <p className="mt-1 text-lg font-black text-amber-300">
                      {(Math.floor(playerExp / 1000) * 0.1).toFixed(1)} USDT0
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    <span>Next reward milestone</span>
                    <span>{playerExp % 1000}/1000 EXP</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-emerald-400 transition-all"
                      style={{ width: `${Math.min(100, ((playerExp % 1000) / 1000) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Reward Formula</p>
                    <p className="mt-2 text-sm text-slate-200">
                      Every 1000 EXP can be redeemed for <span className="font-black text-emerald-300">0.1 USDT0</span>.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Status</p>
                    <p className="mt-2 text-sm text-slate-200">
                      {canWithdraw
                        ? "You have enough EXP for this withdrawal."
                        : "Choose an amount in steps of 1000 EXP."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Withdraw Rewards</p>
                <p className="mt-2 text-sm text-slate-200">
                  Send your earned USDT0 directly to the connected wallet address.
                </p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    EXP to redeem
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={withdrawExpInput}
                    onChange={(e) => setWithdrawExpInput(e.target.value)}
                    className="mt-3 w-full rounded-2xl border border-slate-600 bg-slate-900/90 px-4 py-3 text-lg font-black text-white outline-none focus:border-amber-400"
                  />
                  <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Estimated payout</p>
                    <p className="mt-2 text-3xl font-black text-emerald-300">{withdrawPreviewUsdt0} USDT0</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={withdrawRewards}
                  disabled={isWithdrawing || !authToken || !canWithdraw}
                  className="mt-5 w-full rounded-2xl bg-emerald-500 px-6 py-3.5 font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isWithdrawing ? "Withdrawing..." : "Withdraw to this wallet"}
                </button>
              </div>
            </div>

            {(errorMessage || withdrawResult) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {errorMessage && (
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
                    {errorMessage}
                  </div>
                )}
                {withdrawResult && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-300">
                    {withdrawResult}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
