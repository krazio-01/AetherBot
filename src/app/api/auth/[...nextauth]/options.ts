import { NextAuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import DiscordProvider from 'next-auth/providers/discord';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import connectToDB from '@/utils/dbConnect';
import User from '@/models/userModel';
import { ISessionUser } from '@/types';
import { sendEmail } from '@/utils/sendMail';

declare module 'next-auth' {
    interface Session {
        user: ISessionUser & DefaultSession['user'];
    }
    interface User {
        _id?: string;
        avatar?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT extends ISessionUser { }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
                identifier: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.identifier || !credentials?.password) throw new Error('Please fill all fields');

                await connectToDB();

                const user = await User.findOne({ email: credentials.identifier });

                if (!user) throw new Error('Invalid email or password');

                if (!user.isVerified) {
                    const now = new Date();

                    if (!user.verifyTokenExpiry || user.verifyTokenExpiry < now) {
                        const newToken = uuidv4();
                        user.verifyToken = newToken;
                        user.verifyTokenExpiry = new Date(Date.now() + 86400000); // 24 hours
                        await user.save();

                        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

                        await sendEmail(user.email, 'Account Verification', 'verify-account.html', {
                            name: user.name || 'User',
                            verifyLink: `${frontendUrl}/verify-email?token=${newToken}`,
                        });

                        throw new Error(
                            'Your previous verification link expired. We just sent a fresh one to your email!',
                        );
                    }

                    throw new Error('Please verify your email. Check your inbox or spam folder.');
                }

                if (!user.password) throw new Error("You used a social login. Use 'Forgot Password' to set one.");
                const checkPassword = await bcrypt.compare(credentials.password, user.password);

                if (!checkPassword) throw new Error('Invalid email or password');

                return {
                    id: user._id.toString(),
                    _id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                };
            },
        }),
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID || '',
            clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        }),
    ],
    callbacks: {
        async signIn({ account, user }) {
            if (account?.provider === 'discord' || account?.provider === 'github') {
                await connectToDB();

                try {
                    if (!user?.email) return false;

                    let dbUser = await User.findOne({ email: user.email });

                    if (!dbUser) {
                        dbUser = await User.create({
                            name: user.name,
                            email: user.email,
                            avatar: user.image,
                            isVerified: true,
                        });
                    } else {
                        dbUser.name = user.name || dbUser.name;
                        dbUser.avatar = user.image || dbUser.avatar;
                        dbUser.isVerified = true;
                        dbUser.verifyToken = undefined;
                        dbUser.verifyTokenExpiry = undefined;

                        await dbUser.save();
                    }

                    user.id = dbUser._id.toString();
                    user.avatar = dbUser.avatar;

                    return true;
                } catch (error) {
                    console.error('OAuth Login Error:', error);
                    return false;
                }
            }

            if (account?.provider === 'credentials') return true;

            return false;
        },
        async jwt({ token, user }) {
            if (user) {
                token._id = user._id?.toString() || user.id;
                token.avatar = user.avatar || user.image;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user._id = token._id;
                session.user.avatar = token.avatar;
            }
            return session;
        },
    },
    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },
};
