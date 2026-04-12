import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import robotsTxt from 'astro-robots-txt'
import expressiveCode from 'astro-expressive-code'
import { remarkPlugins, rehypePlugins } from './plugins'
import { SITE } from './src/config'
import fs from 'fs'

export default defineConfig({
  site: SITE.website,
  base: SITE.base,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  vite: {
    plugins: [tailwindcss()],
    assetsInclude: ['**/*.pdf'],
    resolve: {
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
        langs: [JSON.parse(fs.readFileSync('./src/syntax/pl.tmLanguage.json', 'utf-8'))],
      },
    }),
    mdx(),
    react(),
    sitemap(),
    robotsTxt(),
  ],
})
