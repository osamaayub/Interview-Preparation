import Vapi from "@vapi-ai/web";

const publicKey = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

if (!publicKey) {
  throw new Error(
    "NEXT_PUBLIC_VAPI_WEB_TOKEN is not defined. Add it to your environment variables."
  );
}

export const vapi = new Vapi(publicKey);
