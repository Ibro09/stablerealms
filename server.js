import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ethers } from "ethers";
import { fileURLToPath } from "url";

dotenv.config();

function getRuntimeConfig() {
  const {
    MONGODB_URI,
    JWT_SECRET,
    STABLE_RPC_URL = "https://rpc.stable.xyz",
    STABLE_NATIVE_DECIMALS = "18",
    PAYOUT_WALLET_PRIVATE_KEY,
    PORT = "4000",
  } = process.env;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required in environment variables.");
  }
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is required in environment variables.");
  }

  return {
    MONGODB_URI,
    JWT_SECRET,
    STABLE_RPC_URL,
    STABLE_NATIVE_DECIMALS,
    PAYOUT_WALLET_PRIVATE_KEY,
    PORT,
  };
}

let mongoConnectPromise = null;

async function ensureMongoConnected(mongoUri) {
  if (mongoose.connection.readyState === 1) return;

  if (!mongoConnectPromise) {
    mongoConnectPromise = mongoose.connect(mongoUri);
  }
  await mongoConnectPromise;
}

function getModels() {
  const playerSchema = new mongoose.Schema(
    {
      walletAddress: { type: String, required: true, unique: true, index: true },
      exp: { type: Number, default: 0, min: 0 },
      totalUsdt0Withdrawn: { type: String, default: "0" },
    },
    { timestamps: true }
  );

  const nonceSchema = new mongoose.Schema(
    {
      walletAddress: { type: String, required: true, unique: true, index: true },
      nonce: { type: String, required: true },
    },
    { timestamps: true }
  );

  const withdrawalSchema = new mongoose.Schema(
    {
      walletAddress: { type: String, required: true, index: true },
      expRedeemed: { type: Number, required: true, min: 0 },
      usdt0Amount: { type: String, required: true },
      txHash: { type: String, required: true },
    },
    { timestamps: true }
  );

  const Player = mongoose.models.Player || mongoose.model("Player", playerSchema);
  const AuthNonce = mongoose.models.AuthNonce || mongoose.model("AuthNonce", nonceSchema);
  const Withdrawal =
    mongoose.models.Withdrawal || mongoose.model("Withdrawal", withdrawalSchema);

  return { Player, AuthNonce, Withdrawal };
}

function normalizeWalletAddress(address) {
  if (typeof address !== "string") {
    throw new Error("Wallet address must be a string.");
  }

  const trimmed = address.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
    throw new Error("Wallet address must be a 20-byte hex string.");
  }

  // Lowercase first to avoid rejecting valid-but-non-checksummed mixed-case inputs.
  return ethers.getAddress(trimmed.toLowerCase()).toLowerCase();
}

function buildAuthMessage(address, nonce) {
  return `Voxelverse login\nWallet: ${address}\nNonce: ${nonce}`;
}

function makeAuthMiddleware(jwtSecret) {
  return function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token." });
    }

    const token = header.slice("Bearer ".length);
    try {
      const payload = jwt.verify(token, jwtSecret);
      req.walletAddress = payload.walletAddress;
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
  };
}

function makePayoutSender(config) {
  return async function sendStablePayout(toAddress, expToRedeem) {
    if (!config.PAYOUT_WALLET_PRIVATE_KEY) {
      throw new Error("PAYOUT_WALLET_PRIVATE_KEY is not configured.");
    }

    const privateKeyRaw = config.PAYOUT_WALLET_PRIVATE_KEY.trim();
    if (!privateKeyRaw || privateKeyRaw.includes("YOUR_PRIVATE_KEY")) {
      throw new Error(
        "PAYOUT_WALLET_PRIVATE_KEY is a placeholder. Set your real private key in .env."
      );
    }

    const privateKeyNormalized = privateKeyRaw.startsWith("0x")
      ? privateKeyRaw
      : `0x${privateKeyRaw}`;
    if (!/^0x[0-9a-fA-F]{64}$/.test(privateKeyNormalized)) {
      throw new Error(
        "PAYOUT_WALLET_PRIVATE_KEY must be 64 hex characters (with or without 0x prefix)."
      );
    }

    const decimals = Number(config.STABLE_NATIVE_DECIMALS);
    if (!Number.isInteger(decimals) || decimals < 0) {
      throw new Error("STABLE_NATIVE_DECIMALS must be a non-negative integer.");
    }

    const provider = new ethers.JsonRpcProvider(config.STABLE_RPC_URL);
    const wallet = new ethers.Wallet(privateKeyNormalized, provider);
    const units = 10n ** BigInt(decimals);
    const payoutInBaseUnits = (BigInt(expToRedeem) * units) / 10000n;

    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: payoutInBaseUnits,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
      usdt0Amount: ethers.formatUnits(payoutInBaseUnits, decimals),
    };
  };
}

export async function createApiApp() {
  const config = getRuntimeConfig();
  await ensureMongoConnected(config.MONGODB_URI);
  const { Player, AuthNonce, Withdrawal } = getModels();
  const authMiddleware = makeAuthMiddleware(config.JWT_SECRET);
  const sendStablePayout = makePayoutSender(config);

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.get("/api/health", async (_req, res) => {
    const state = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    return res.json({ ok: true, mongo: state });
  });
  app.get("/health", async (_req, res) => {
    const state = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    return res.json({ ok: true, mongo: state });
  });

  app.post("/api/auth/nonce", async (req, res) => {
    try {
      const { address } = req.body ?? {};
      if (!address || typeof address !== "string") {
        return res.status(400).json({ error: "Wallet address is required." });
      }

      const normalized = normalizeWalletAddress(address);
      const nonce = crypto.randomUUID();
      await AuthNonce.findOneAndUpdate(
        { walletAddress: normalized },
        { walletAddress: normalized, nonce },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.json({
        nonce,
        message: buildAuthMessage(normalized, nonce),
        walletAddress: normalized,
      });
    } catch {
      return res.status(400).json({ error: "Invalid wallet address format." });
    }
  });

  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { address, signature } = req.body ?? {};
      if (!address || typeof address !== "string" || !signature || typeof signature !== "string") {
        return res.status(400).json({ error: "Address and signature are required." });
      }

      const normalized = normalizeWalletAddress(address);
      const nonceRecord = await AuthNonce.findOne({ walletAddress: normalized });
      if (!nonceRecord) {
        return res.status(400).json({ error: "Nonce not found. Request a new nonce." });
      }

      const message = buildAuthMessage(normalized, nonceRecord.nonce);
      const recovered = normalizeWalletAddress(ethers.verifyMessage(message, signature));
      if (recovered !== normalized) {
        return res.status(401).json({ error: "Signature verification failed." });
      }

      const player = await Player.findOneAndUpdate(
        { walletAddress: normalized },
        { $setOnInsert: { walletAddress: normalized, exp: 0, totalUsdt0Withdrawn: "0" } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      nonceRecord.nonce = crypto.randomUUID();
      await nonceRecord.save();

      const token = jwt.sign({ walletAddress: normalized }, config.JWT_SECRET, {
        expiresIn: "7d",
      });
      return res.json({
        token,
        player: {
          walletAddress: player.walletAddress,
          exp: player.exp,
          totalUsdt0Withdrawn: player.totalUsdt0Withdrawn,
        },
      });
    } catch {
      return res.status(400).json({ error: "Could not verify wallet signature." });
    }
  });

  app.get("/api/player/me", authMiddleware, async (req, res) => {
    const player = await Player.findOne({ walletAddress: req.walletAddress });
    if (!player) {
      return res.status(404).json({ error: "Player not found." });
    }

    return res.json({
      walletAddress: player.walletAddress,
      exp: player.exp,
      totalUsdt0Withdrawn: player.totalUsdt0Withdrawn,
    });
  });

  app.put("/api/player/exp", authMiddleware, async (req, res) => {
    const { exp } = req.body ?? {};
    if (typeof exp !== "number" || !Number.isFinite(exp) || exp < 0) {
      return res.status(400).json({ error: "exp must be a non-negative number." });
    }

    const sanitizedExp = Math.floor(exp);
    const player = await Player.findOneAndUpdate(
      { walletAddress: req.walletAddress },
      { exp: sanitizedExp },
      { new: true }
    );

    if (!player) {
      return res.status(404).json({ error: "Player not found." });
    }

    return res.json({
      walletAddress: player.walletAddress,
      exp: player.exp,
      totalUsdt0Withdrawn: player.totalUsdt0Withdrawn,
    });
  });

  app.post("/api/player/withdraw", authMiddleware, async (req, res) => {
    const { expToRedeem } = req.body ?? {};
    if (!Number.isInteger(expToRedeem) || expToRedeem < 1000 || expToRedeem % 1000 !== 0) {
      return res
        .status(400)
        .json({ error: "expToRedeem must be an integer >= 1000 and divisible by 1000." });
    }

    const player = await Player.findOne({ walletAddress: req.walletAddress });
    if (!player) {
      return res.status(404).json({ error: "Player not found." });
    }
    if (player.exp < expToRedeem) {
      return res.status(400).json({ error: "Not enough EXP to withdraw." });
    }

    try {
      const payout = await sendStablePayout(player.walletAddress, expToRedeem);
      player.exp -= expToRedeem;
      player.totalUsdt0Withdrawn = (
        Number(player.totalUsdt0Withdrawn) + Number(payout.usdt0Amount)
      ).toString();
      await player.save();

      await Withdrawal.create({
        walletAddress: player.walletAddress,
        expRedeemed: expToRedeem,
        usdt0Amount: payout.usdt0Amount,
        txHash: payout.txHash,
      });

      return res.json({
        txHash: payout.txHash,
        usdt0Sent: payout.usdt0Amount,
        expRemaining: player.exp,
        totalUsdt0Withdrawn: player.totalUsdt0Withdrawn,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payout failed.";
      return res.status(500).json({ error: message });
    }
  });

  return app;
}

export async function startServer() {
  const config = getRuntimeConfig();
  const app = await createApiApp();
  app.listen(Number(config.PORT), () => {
    console.log(`API listening on port ${config.PORT}`);
  });
}

const currentModulePath =
  typeof import.meta.url === "string" && import.meta.url.startsWith("file:")
    ? fileURLToPath(import.meta.url)
    : null;

if (process.argv[1] && currentModulePath === process.argv[1]) {
  startServer();
}
