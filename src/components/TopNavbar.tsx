import { MessageCircle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { readJsonSafe } from "../utils/http";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};

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

async function connectStableAndAuthenticate() {
  const provider = getProvider();
  if (!provider) throw new Error("No wallet found. Install MetaMask or another EVM wallet.");

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
  if (!selected) throw new Error("No wallet account selected.");

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
    player?: { walletAddress?: string };
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
  return verifyPayload.player.walletAddress;
}

export function TopNavbar({ floating = false }: { floating?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(
    () => localStorage.getItem(WALLET_ADDRESS_KEY),
  );
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const syncWallet = () => {
      setWalletAddress(localStorage.getItem(WALLET_ADDRESS_KEY));
    };

    window.addEventListener("wallet-auth-updated", syncWallet);
    window.addEventListener("storage", syncWallet);
    return () => {
      window.removeEventListener("wallet-auth-updated", syncWallet);
      window.removeEventListener("storage", syncWallet);
    };
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const address = await connectStableAndAuthenticate();
      setWalletAddress(address);
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Wallet connect failed.";
      const message =
        rawMessage.toLowerCase().includes("failed to fetch")
          ? "Backend API is offline. Start it with: npm run server"
          : rawMessage;
      window.alert(message);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <header
      className={
        floating
          ? "absolute left-1/2 top-4 z-50 w-[92%] max-w-7xl -translate-x-1/2 sm:top-5"
          : "mx-auto mt-4 w-[92%] max-w-7xl"
      }
    >
      <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl sm:px-6 md:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <Link to="/" className="text-xl font-serif tracking-[0.18em] text-white sm:text-2xl">
              KINTARA
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-semibold text-white/95 md:flex">
              <Link to="/how-to-play" className="transition-colors hover:text-white">
                How to Play
              </Link>
              <Link to="/wallet" className="transition-colors hover:text-white">
                Wallet
              </Link>
            </nav>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <a href="#" className="text-white/90 hover:text-white" aria-label="Community">
              <MessageCircle size={16} />
            </a>
            <a href="#" className="text-white/90 hover:text-white" aria-label="Announcements">
              <Send size={16} />
            </a>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="rounded-xl border border-amber-800/50 bg-orange-500 px-5 py-2.5 text-sm font-black text-slate-900 shadow-xl transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isConnecting ? "Connecting..." : walletAddress ? shortAddress(walletAddress) : "Connect"}
            </button>
          </div>

          <button
            type="button"
            className="rounded-lg border border-white/30 px-3 py-2 text-sm font-bold text-white md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mt-4 space-y-3 rounded-xl border border-white/20 bg-sky-400/25 p-3 md:hidden">
            <Link
              to="/how-to-play"
              className="block rounded-lg bg-white/10 px-2 py-2 text-sm font-semibold text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              How to Play
            </Link>
            <Link
              to="/wallet"
              className="block rounded-lg px-2 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              Wallet
            </Link>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full rounded-xl border border-amber-800/50 bg-orange-500 px-6 py-3 text-sm font-black text-slate-900 shadow-xl transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isConnecting ? "Connecting..." : walletAddress ? shortAddress(walletAddress) : "Connect"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
