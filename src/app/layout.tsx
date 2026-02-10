import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Socratic Mirror Agent | Mizzou AI Coaching",
    description: "High-frequency multimodal AI coaching system with real-time biometric feedback and 3D avatar interaction",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
