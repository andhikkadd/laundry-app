import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-12345';
const key = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  email: string;
  name: string;
  role: string;
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('bilasin_session')?.value;
  if (!token) return null;
  return await decrypt(token);
}

export async function setAdminSession(payload: SessionPayload) {
  const token = await encrypt(payload);
  const cookieStore = await cookies();
  cookieStore.set('bilasin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2 * 60 * 60, // 2 hours
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete('bilasin_session');
}
