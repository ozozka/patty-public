import { z } from "zod";

const encoder = new TextEncoder();

function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

const jwtPayloadSchema = z.object({
  sub: z.string(),
  role: z.string().optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

type JwtPayload = z.infer<typeof jwtPayloadSchema> & { [key: string]: unknown };

export async function verifyJwtEdge(
  token: string,
  secret: string,
): Promise<JwtPayload | null> {
  if (!secret) {
    return null;
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const headerB64 = parts[0];
    const payloadB64 = parts[1];
    const signatureB64 = parts[2];

    if (!headerB64 || !payloadB64 || !signatureB64) {
      return null;
    }

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = base64urlDecode(signatureB64);
    const key = await getCryptoKey(secret);

    // Copy signature bytes into a fresh ArrayBuffer so crypto.subtle.verify
    // always receives a plain BufferSource (no SharedArrayBuffer ambiguity).
    const signatureCopy = new ArrayBuffer(signature.byteLength);
    new Uint8Array(signatureCopy).set(signature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureCopy,
      data,
    );

    if (!isValid) {
      return null;
    }

    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = jwtPayloadSchema.safeParse(JSON.parse(payloadJson));
    if (!parsed.success) {
      return null;
    }
    const payload: JwtPayload = parsed.data;

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
