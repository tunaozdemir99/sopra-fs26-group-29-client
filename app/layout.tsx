import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Student XX-XXX-XXX",
  description: "sopra-fs26-template-client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorPrimary: "#2563eb",
              borderRadius: 8,
              colorText: "#111111",
              fontSize: 16,
              colorBgContainer: "#ffffff",
            },
            components: {
              Button: {
                colorPrimary: "#2563eb",
                algorithm: true,
                controlHeight: 38,
              },
              Input: {
                colorBorder: "#d1d5db",
                colorTextPlaceholder: "#9ca3af",
                algorithm: false,
              },
              Form: {
                labelColor: "#111111",
                algorithm: theme.defaultAlgorithm,
              },
              Card: {
                colorBgContainer: "#ffffff",
              },
              Tabs: {
                colorText: "#111111",
              },
            },
          }}
        >
          <AntdRegistry>
            <AntdApp>{children}</AntdApp>
          </AntdRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}
