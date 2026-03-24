import { NextAuthOptions, Profile, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import DiscordProvider from 'next-auth/providers/discord';
import bcrypt from 'bcrypt';
import connectToDB from '@/utils/dbConnect';
import User from '@/models/userModel';

declare module 'next-auth' {
    interface Session {
        user: {
            _id?: string;
            avatar?: string;
        } & DefaultSession['user'];
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        _id?: string;
        avatar?: string;
    }
}

interface ICustomProfile extends Profile {
    global_name?: string;
    username?: string;
    image_url?: string;
    login?: string;
    avatar_url?: string;
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

                const user = await User.findOne({
                    email: credentials.identifier,
                });

                if (!user) throw new Error('This account is not registered');

                if (!user.isVerified) throw new Error('Please verify your email');

                if (!user.password) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(credentials.password, salt);
                    user.password = hashedPassword;

                    await user.save();
                } else {
                    const checkPassword = await bcrypt.compare(credentials.password, user.password);
                    if (!checkPassword) throw new Error('Invalid credentials');
                }

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
        async signIn({ account, profile }) {
            const customProfile = profile as ICustomProfile;

            if (account?.provider === 'discord') {
                await connectToDB();

                try {
                    if (!customProfile?.email) return false;

                    let user = await User.findOne({ email: customProfile.email });
                    if (!user) {
                        const newUser = new User({
                            name: customProfile.username || customProfile.global_name,
                            email: customProfile.email,
                            avatar: customProfile.image_url,
                            isVerified: true,
                        });
                        await newUser.save();
                    } else {
                        user.name = customProfile.username || customProfile.global_name;
                        user.avatar = customProfile.image_url;
                        if (!user.isVerified) {
                            user.verifyToken = undefined;
                            user.verifyTokenExpiry = undefined;
                            user.isVerified = true;
                        }
                        await user.save();
                    }
                    return true;
                } catch (error) {
                    throw new Error(error instanceof Error ? error.message : 'Discord login failed');
                }
            }

            if (account?.provider === 'github') {
                await connectToDB();

                try {
                    if (!customProfile?.email) return false;

                    let user = await User.findOne({ email: customProfile.email });
                    if (!user) {
                        const newUser = new User({
                            name: customProfile.name || customProfile.login,
                            email: customProfile.email,
                            avatar: customProfile.avatar_url,
                            isVerified: true,
                        });
                        await newUser.save();
                    } else {
                        user.name = customProfile.name || customProfile.login;
                        user.avatar = customProfile.avatar_url;
                        if (!user.isVerified) {
                            user.verifyToken = undefined;
                            user.verifyTokenExpiry = undefined;
                            user.isVerified = true;
                        }
                        await user.save();
                    }
                    return true;
                } catch (error) {
                    throw new Error(error instanceof Error ? error.message : 'GitHub login failed');
                }
            }

            if (account?.provider === 'credentials') {
                return true;
            }

            return false;
        },
        async jwt({ token, user }) {
            if (user) {
                token._id = (user as any)._id?.toString();
                token.avatar = (user as any).avatar;
            }
            return token;
        },
        async session({ session, token }) {
            await connectToDB();

            if (token && session.user) {
                const sessionUser = await User.findOne({
                    email: session.user.email,
                });

                if (sessionUser) {
                    session.user._id = sessionUser._id.toString();
                    session.user.avatar = sessionUser.avatar;
                }
            }
            return session;
        },
    },
    session: {
        strategy: 'jwt',
    },
};
