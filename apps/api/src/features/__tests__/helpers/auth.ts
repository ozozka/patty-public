import { signAccessToken } from "@patty/api/lib/jwt";

export async function generateToken(accountId: string): Promise<string> {
  return signAccessToken(accountId, 0);
}

export async function generateAuthHeader(
  accountId: string,
): Promise<Record<string, string>> {
  const token = await generateToken(accountId);
  return { Authorization: `Bearer ${token}` };
}
