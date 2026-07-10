import { defineConfig, loadEnv } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [uni()],
    define: {
      "import.meta.env.VITE_DEEPSEEK_API_KEY": JSON.stringify(
        env.VITE_DEEPSEEK_API_KEY
      ),
    },
  };
});
