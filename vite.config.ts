import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	optimizeDeps: {
		exclude: ['@sqlite.org/sqlite-wasm'],
	},
	plugins: [
		sveltekit(),
		tailwindcss(),
	],
	worker : {
		plugins: () => [sveltekit()],
		format: "es",
	},
	build: {
		target: "ES2022",
	},
});
