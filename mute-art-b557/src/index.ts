import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
} from "@solana/actions";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Buffer } from "node:buffer";

if (globalThis.Buffer === undefined) {
  globalThis.Buffer = Buffer;
}

// you should use a private RPC here
const connection = new Connection("https://api.mainnet-beta.solana.com");

const app = new Hono();

// see https://solana.com/docs/advanced/actions#options-response
app.use(
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "Accept-Encoding"],
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
  })
);

app.get("/", (c) => {
  const response: ActionGetResponse = {
    title: "Send MAINDOCS some SOL",
    description: "This is a tip jar for MAINDOCS",
    icon: "https://pbs.twimg.com/profile_banners/1774017790728396800/1711904900/1500x500",
    label: "Tip 0.001 SOL",
  };

  return c.json(response);
});

app.post("/", async (c) => {
  const req = await c.req.json<ActionPostRequest>();

  const transaction = await prepareTransaction(new PublicKey(req.account));

  const response: ActionPostResponse = {
    transaction: Buffer.from(transaction.serialize()).toString("base64"),
  };

  return c.json(response);
});

async function prepareTransaction(payer: PublicKey) {
  const transferIx = SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: new PublicKey("7DqbEWdH4ufSPZkpzseghzkwKtBgin9uRtBUkDj834r6"),
    //lamports: 10000000, // 0.1 sol
    lamports: 1000000, // 0.001 sol
  });

  const blockhash = await connection
    .getLatestBlockhash({ commitment: "max" })
    .then((res) => res.blockhash);
  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: [transferIx],
  }).compileToV0Message();
  return new VersionedTransaction(messageV0);
}

export default app;
