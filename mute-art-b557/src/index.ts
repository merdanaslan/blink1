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
    links: {
      actions: [
        {
          href: "/0.1",
          label: "Tip 0.1 SOL",
        },
        {
          href: "/0.2",
          label: "Tip 0.2 SOL",
        },
        {
          href: "/{amount}",
          label: "Tip any amount",
          parameters: [{
            type: "number",
            name: "amount",
            min: 0.001,
            max: 100,
          }]
        },    
      ],
    },
  };

  return c.json(response);
});

app.post("/:amount", async (c) => {
  const req = await c.req.json<ActionPostRequest>();
  const amount = parseFloat(c.req.param("amount"));

  console.log(amount);
  
  const transaction = await prepareTransaction(new PublicKey(req.account), amount);
  
  
  const response: ActionPostResponse = {
    transaction: Buffer.from(transaction.serialize()).toString("base64"),
  };

  return c.json(response);
});

async function prepareTransaction(payer: PublicKey, amount: number) {
  const transferIx = SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: new PublicKey("7DqbEWdH4ufSPZkpzseghzkwKtBgin9uRtBUkDj834r6"),
    //lamports: 10000000, // 0.1 sol
    lamports: amount * 1000000000, // 0.1 sol
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
