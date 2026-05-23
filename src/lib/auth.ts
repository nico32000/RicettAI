import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Nome", type: "text" },
        isRegister: { label: "Register", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        if (credentials.isRegister === "true") {
          // Registrazione
          const existing = await prisma.user.findUnique({ where: { email: credentials.email } });
          if (existing) throw new Error("Email già registrata");

          const hashed = await bcrypt.hash(credentials.password, 10);
          const user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.name || credentials.email.split("@")[0],
              password: hashed,
            },
          });
          await prisma.profile.create({ data: { userId: user.id } });
          return { id: user.id, email: user.email, name: user.name };
        } else {
          // Login
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });
          if (!user?.password) throw new Error("Usa il login con Google");
          const valid = await bcrypt.compare(credentials.password, user.password);
          if (!valid) throw new Error("Password errata");
          return { id: user.id, email: user.email, name: user.name };
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (existing) {
          await prisma.user.update({
            where: { email: user.email },
            data: { name: user.name, image: user.image },
          });
          // Usa l'ID esistente
          user.id = existing.id;
        } else {
          const created = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
            },
          });
          user.id = created.id;
        }
        await prisma.profile.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token?.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  pages: { signIn: "/auth/signin" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};