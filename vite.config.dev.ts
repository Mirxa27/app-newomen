
import { defineConfig, loadConfigFromFile } from "vite";
import type { Plugin, ConfigEnv } from "vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import fs from "fs/promises";
import path from "path";

    const env: ConfigEnv = { command: "serve", mode: "development" };
    const configFile = path.resolve(__dirname, "vite.config.ts");
    const result = await loadConfigFromFile(env, configFile);
    const userConfig = result?.config;

    export default defineConfig({
      ...userConfig,
      resolve: {
        ...userConfig?.resolve,
        alias: {
          ...userConfig?.resolve?.alias,
        },
        dedupe: [
          ...(userConfig?.resolve?.dedupe || []),
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react-helmet-async',
        ],
        preserveSymlinks: false,
      },
      optimizeDeps: {
        ...userConfig?.optimizeDeps,
        include: [
          ...(userConfig?.optimizeDeps?.include || []),
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
        ],
        force: true,
      },
      plugins: [
        ...(userConfig?.plugins || []),
        
{
  name: 'hmr-toggle',
  configureServer(server) {
    let hmrEnabled = true;

    // 包装原来的 send 方法 - 只在 WebSocket 连接存在时包装
    if (server.ws) {
      const _send = server.ws.send.bind(server.ws);
      server.ws.send = (payload) => {
        if (hmrEnabled) {
          return _send(payload);
        } else {
          console.log('[HMR disabled] skipped payload:', payload.type);
        }
      };
    }

    // 提供接口切换 HMR
    server.middlewares.use('/innerapi/v1/sourcecode/__hmr_off', (req, res) => {
      hmrEnabled = false;
      let body = {
          status: 0,
          msg: 'HMR disabled'
      };
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    });

    server.middlewares.use('/innerapi/v1/sourcecode/__hmr_on', (req, res) => {
      hmrEnabled = true;
      let body = {
          status: 0,
          msg: 'HMR enabled'
      };
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    });

    // 注册一个 HTTP API，用来手动触发一次整体刷新
    server.middlewares.use('/innerapi/v1/sourcecode/__hmr_reload', (req, res) => {
      if (hmrEnabled) {
        server.ws.send({
          type: 'full-reload',
          path: '*', // 整页刷新
        });
      }
      res.statusCode = 200;
      let body = {
          status: 0,
          msg: 'Manual full reload triggered'
      };
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    });
  },
  load(id) {
    if (id === 'virtual:after-update') {
      return `
        if (import.meta.hot) {
          import.meta.hot.on('vite:afterUpdate', () => {
            window.postMessage(
              {
                type: 'editor-update'
              },
              '*'
            );
          });
        }
      `;
    }
  },
  transformIndexHtml(html) {
    return {
      html,
      tags: [
        {
          tag: 'script',
          attrs: {
            type: 'module',
            src: '/@id/virtual:after-update'
          },
          injectTo: 'body'
        }
      ]
    };
  }
},

      ]
    });
