'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { getAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const createStaffSchema = z.object({
  name: z.string().min(1, 'Nama staff wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(4, 'Password minimal 4 karakter'),
});

export async function getStaffAccounts() {
  try {
    const session = await getAdminSession();
    if (!session) {
      throw new Error('Unauthorized');
    }

    const staffs = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return { success: true, staffs };
  } catch (err) {
    console.error('Error fetching staff accounts:', err);
    return { error: 'Gagal memuat daftar staff' };
  }
}

export async function createStaffAccount(formData: FormData) {
  try {
    const session = await getAdminSession();
    if (!session) return { error: 'Sesi habis, silakan login kembali' };

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const validated = createStaffSchema.safeParse({ name, email, password });
    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return { error: 'Email sudah terdaftar di sistem' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Save to DB
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'ADMIN',
      },
    });

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (err) {
    console.error('Error creating staff account:', err);
    return { error: 'Gagal membuat akun staff baru' };
  }
}

export async function deleteStaffAccount(id: string) {
  try {
    const session = await getAdminSession();
    if (!session) return { error: 'Sesi habis, silakan login kembali' };

    // Prevent deleting active user
    if (session.email) {
      const activeUser = await prisma.user.findUnique({
        where: { email: session.email },
      });
      if (activeUser && activeUser.id === id) {
        return { error: 'Anda tidak dapat menghapus akun Anda yang sedang digunakan!' };
      }
    }

    // Prevent deleting if it is the only user left
    const totalUsers = await prisma.user.count();
    if (totalUsers <= 1) {
      return { error: 'Tidak dapat menghapus akun terakhir di sistem!' };
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (err) {
    console.error('Error deleting staff account:', err);
    return { error: 'Gagal menghapus akun staff' };
  }
}

export async function updateStaffPassword(id: string, newPassword: string) {
  try {
    const session = await getAdminSession();
    if (!session) return { error: 'Sesi habis, silakan login kembali' };

    if (!newPassword || newPassword.length < 4) {
      return { error: 'Password minimal 4 karakter' };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { success: true };
  } catch (err) {
    console.error('Error updating password:', err);
    return { error: 'Gagal memperbarui password staff' };
  }
}
