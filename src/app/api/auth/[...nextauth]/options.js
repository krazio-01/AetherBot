import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcrypt";
import connectToDB from "@/utils/dbConnect";
import User from "@/models/userModel";

export const authOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials.identifier || !credentials.password)
                    throw new Error("Please fill all fields");

                // connect to the database
                await connectToDB();

                const user = await User.findOne({
                    email: credentials.identifier,
                });

                if (!user) throw new Error("This account is not registered");

                if (!user.isVerified)
                    throw new Error("Please verify your email");

                if (!user.password) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(
                        credentials.password,
                        salt
                    );
                    user.password = hashedPassword;

                    await user.save();
                } else {
                    const checkPassword = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );
                    if (!checkPassword) throw new Error("Invalid credentials");
                }

                return user;
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async signIn({ account, profile }) {
            if (account?.provider === "google") {
                await connectToDB();

                try {
                    if (!profile.email) return false;

                    let user = await User.findOne({ email: profile.email });
                    if (!user) {
                        const newUser = new User({
                            name: profile.name,
                            email: profile.email,
                            avatar: profile.picture,
                            isVerified: true,
                        });
                        await newUser.save();
                    } else {
                        user.name = profile.name;
                        user.avatar = profile.picture;
                        if (!user.isVerified) {
                            user.verifyToken = undefined;
                            user.verifyTokenExpiry = undefined;
                            user.isVerified = true;
                        }
                        await user.save();
                    }
                    return true;
                } catch (error) {
                    throw new Error(error);
                }
            }

            if (account?.provider === "github") {
                await connectToDB();

                try {
                    if (!profile.email) return false;

                    let user = await User.findOne({ email: profile.email });
                    if (!user) {
                        const newUser = new User({
                            name: profile.name || profile.login,
                            email: profile.email,
                            avatar: profile.avatar_url,
                            isVerified: true,
                        });
                        await newUser.save();
                    } else {
                        user.name = profile.name || profile.login;
                        user.avatar = profile.avatar_url;
                        if (!user.isVerified) {
                            user.verifyToken = undefined;
                            user.verifyTokenExpiry = undefined;
                            user.isVerified = true;
                        }
                        await user.save();
                    }
                    return true;
                } catch (error) {
                    throw new Error(error);
                }
            }

            if (account?.provider === "credentials") {
                return true;
            }

            return false;
        },
        async jwt({ token, user }) {
            if (user) {
                token._id = user._id?.toString();
                token.avatar = user.avatar;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                const sessionUser = await User.findOne({
                    email: session.user.email,
                });
                session.user._id = sessionUser._id;
                session.user.avatar = sessionUser.avatar;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
};
