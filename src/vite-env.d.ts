/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WECHAT_APP_ID: string
  readonly VITE_WECHAT_APP_SECRET: string
  readonly VITE_WECHAT_TEMPLATE_ID: string
  readonly VITE_WECHAT_TO_USER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}