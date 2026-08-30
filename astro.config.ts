import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { fileURLToPath } from 'node:url'
import robotsTxt from 'astro-robots-txt'
import expressiveCode from 'astro-expressive-code'
import { remarkPlugins, rehypePlugins } from './plugins'
import { SITE } from './src/config'
import mermaid from 'astro-mermaid'
import type { LanguageInput } from 'shiki'

const syntaxDefinitions = Object.values(
  import.meta.glob<LanguageInput>('./src/syntax/*.tmLanguage.json', { eager: true, import: 'default' })
)

export default defineConfig({
  site: SITE.website,
  base: SITE.base,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  build: {
    assets: 'assets',
  },
  vite: {
    plugins: [tailwindcss()],
    assetsInclude: ['**/*.pdf'],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./packages/mdx-blog-components/src', import.meta.url)),
        'mdx-blog-components': fileURLToPath(new URL('./packages/mdx-blog-components/src', import.meta.url)),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.astro', '.mdx'],
    },
  },
  markdown: {
    syntaxHighlight: false,
    remarkPlugins,
    rehypePlugins,
  },
  integrations: [
    expressiveCode({
      shiki: {
        langs: syntaxDefinitions,
      },
    }),
    mdx(),
    react(),
    sitemap(),
    robotsTxt(),
    mermaid({
      theme: 'dark',
      autoTheme: true,
    }),
  ],
})
