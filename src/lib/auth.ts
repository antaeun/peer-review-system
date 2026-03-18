// HMAC 기반 stateless 관리자 인증
// 비밀번호 검증 후 HMAC 서명된 쿠키를 발급하여 세션 유지

const COOKIE_NAME = "admin_session";

async function getHmacSignature(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode("peer-review-admin")
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD!;
  return getHmacSignature(secret);
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  const expected = await getHmacSignature(secret);
  return token === expected;
}

export { COOKIE_NAME };
