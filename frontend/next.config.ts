import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Critical for Amplify deployment
  output: "standalone",

  // Transpile packages that cause issues in Amplify deployment
  transpilePackages: [
    // Radix UI packages
    "@radix-ui/react-accordion",
    "@radix-ui/react-alert-dialog",
    "@radix-ui/react-avatar",
    "@radix-ui/react-checkbox",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-label",
    "@radix-ui/react-popover",
    "@radix-ui/react-select",
    "@radix-ui/react-tabs",
    // Add other UI libraries you're using
    "lucide-react",
    "cmdk",
    "class-variance-authority",
    "framer-motion",
    "recharts",
    // Add any RC packages
    "rc-pagination",
    "rc-util",
    // Add other problematic packages
  ],

  // Server external packages
  serverExternalPackages: ["postgres", "pg", "@aws-sdk/client-s3"],

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle ES modules properly
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };

    // Client-side fallbacks for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },

  poweredByHeader: false,
};

export default nextConfig;
