'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { setAdminSession, clearAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password cannot be empty'),
});

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const validated = loginSchema.safeParse({ email, password });
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  let success = false;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: 'Invalid email or password' };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return { error: 'Invalid email or password' };
    }

    await setAdminSession({
      email: user.email,
      name: user.name,
      role: user.role.toString(),
    });
    success = true;
  } catch (err) {
    console.error('Login error:', err);
    return { error: 'Something went wrong. Please try again.' };
  }

  if (success) {
    redirect('/admin/dashboard');
  }
}

export async function logoutAction() {
  await clearAdminSession();
  redirect('/admin/login');
}
