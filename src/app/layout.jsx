import { ThemeProvider } from "next-themes";
import AuthProvider from "@/context/AuthProvider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata = {
    title: "AetherBot",
    description:
        "Experience seamless conversations with AetherBot, the AI chatbot application designed to assist, engage, and enhance your digital interactions. Discover the future of communication powered by advanced AI technology.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <AuthProvider>
                <body>
                    <ThemeProvider>
                        {children}
                        <Toaster
                            position="top-center"
                            visibleToasts={2}
                            expand={true}
                            richColors
                            duration={2000}
                        />
                    </ThemeProvider>
                </body>
            </AuthProvider>
        </html>
    );
}
