import serverless from "serverless-http";
import { createApiApp } from "../../server.js";

let cachedHandler: ((event: any, context: any) => Promise<any>) | null = null;

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    const app = await createApiApp();
    cachedHandler = serverless(app);
  }
  return cachedHandler(event, context);
};

