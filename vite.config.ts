import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Builds the chatbot as a single, standalone IIFE bundle that can be embedded
// on any page via a <script> tag. The mobile capture page lives in `public/`
// and is copied to the build output verbatim.
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: [".compute.amazonaws.com", ".compute-1.amazonaws.com", "chatbot.renkaat247.fi"],
  },
  // `vite preview` serves the built widget (dist/widget) on port 4173 inside
  // the Docker container — the same deployment method as the old Renkaat app.
  preview: {
    host: true,
    port: 4173,
    allowedHosts: [".compute.amazonaws.com", ".compute-1.amazonaws.com", "chatbot.renkaat247.fi"],
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/widget-entry.ts"),
      name: "RenkaatChatbot",
      // Keep the original filename so existing client embeds keep working:
      //   <script src=".../chatbot.cjs.js?lang=fi"></script>
      fileName: () => "chatbot.cjs.js",
      formats: ["iife"], // browser global, single file
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    minify: "terser",
    sourcemap: false,
    outDir: "dist/widget",
    emptyOutDir: true,
  },
});
