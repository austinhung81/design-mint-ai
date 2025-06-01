# Design Mint AI Figma 外掛  

一個由 AI 大語言模型 (LLM) 所驅動的設計工具助理，這是一個專門設計給 Figma 設計工具使用的外掛程式，目的在輔助搜尋 Figma 中的設計元件與素材。  

本專案採用 React、TypeScript 和 Tailwind CSS 打造。本專案具備模組化元件結構、Firebase 整合，以及易用、可擴充的架構，方便快速開發。

## 技術限制
- 需要搭配使用客製化中介伺服器/程式碼使用 
- 外掛需填入有效 Open AI API key （目前不會使用，只做外掛端驗證）
- 本版本為實驗性質 (pre-alpha)，尚未提供正式版本 (production level) 水準 


## 開發者 - 快速開始

- 執行 `npm install` 安裝相依套件。
- 執行 `npm env:pull` 同步 .env 檔案於不同機器與環境間。
- 執行 `npm build:watch` 啟動 webpack 監控模式。
- 開啟 `Figma` → `外掛` → `開發` → `從 manifest 匯入外掛...`，並選擇本專案中的 `manifest.json` 檔案。

## 特色功能

- 具備對話歷史的 AI 聊天介面
- 模組化 UI 元件（按鈕、對話框、彈出視窗等）
- 檔案資料預覽與 Markdown 渲染
- 設定與自訂選項
- 整合 Firebase 後端服務

## 檔案結構

```
├── app/ # 全域樣式
├── components/ # 可重複使用的 UI 元件
│ └── ui/ # 核心 UI 元素（按鈕、對話框等）
├── lib/ # 工具程式庫
├── src/
│ ├── app/ # 主應用程式入口、設定與資產
│ ├── components/ # 應用專屬的 React 元件
│ ├── constants/ # API 端點與應用常數
│ ├── models/ # TypeScript 模型與型別
│ └── service/ # 服務類別（API、資料庫、通知等）
├── plugin/ # 外掛控制器
├── typings/ # 全域 TypeScript 型別
├── firebaseConfig.js # Firebase 設定檔
├── tailwind.config.js # Tailwind CSS 設定檔
├── webpack.config.js # Webpack 設定檔
├── package.json # 專案相依套件與指令
└── README.md # 專案說明文件
```


## 設定方式

- 編輯 `firebaseConfig.js` 以設定您的 Firebase 專案。
- 更新 `config.ts` 以調整應用程式專屬設定。

## 目錄重點說明

- `app/`：包含全域樣式與 Tailwind CSS 設定。
- `src/components/`：主要的 React 元件，如聊天、歷史紀錄、設定等。
- `src/constants/ui`：可重複使用的 UI 元件（Button、Dialog、Input 等）。
- `src/service/`：處理聊天、對話、檔案資料與通知等服務。
- `src/models/`：定義聊天與檔案相關的 TypeScript 介面與模型。
- `lib/`：常用任務的工具程式庫。
- `firebaseConfig.js`：Firebase 整合設定檔。
- `tailwind.config.js`：Tailwind CSS 設定檔，可自訂樣式。
- `webpack.config.js`：Webpack 設定檔，用於建置外掛。
- `package.json`：專案相依套件與建置、執行指令。
