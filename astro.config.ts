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
import fs from 'fs'
import mermaid from 'astro-mermaid'

function syntaxHighlighting(name: string): any {
  return JSON.parse(fs.readFileSync(`./src/syntax/${name}.tmLanguage.json`, 'utf-8'))
}

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
        '@/': fileURLToPath(new URL('./packages/custom-components/src/', import.meta.url)),
        'mdx-blog-components': fileURLToPath(new URL('./packages/custom-components/src', import.meta.url)),
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
        langs: [syntaxHighlighting('pl'), syntaxHighlighting('dts'), syntaxHighlighting('gen_init_cpio'), syntaxHighlighting('command')],
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
