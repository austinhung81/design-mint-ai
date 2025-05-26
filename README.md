# Design Mint AI Figma Plugin
A modern AI-powered chat and design assistant built with React, TypeScript, and Tailwind CSS. This project features a modular component structure, Firebase integration, and a clean, extensible architecture for rapid development.

## Quickstart

- Run `npm install` to install dependencies.
- Run `npm env:pull` to sync .env files between machines, environments.
- Run `npm build:watch` to start webpack in watch mode.
- Open `Figma` -> `Plugins` -> `Development` -> `Import plugin from manifest...` and choose `manifest.json` file from this repo.

## Features

- AI chat interface with conversation history
- Modular UI components (buttons, dialogs, popovers, etc.)
- File data preview and markdown rendering
- Settings and customization options
- Firebase backend integration


## File Structure

```
.
├── app/                # Global styles
├── components/         # Reusable UI components
│   └── ui/             # Core UI elements (button, dialog, etc.)
├── lib/                # Utility libraries
├── src/
│   ├── app/            # Main app entry, config, and assets
│   ├── components/     # App-specific React components
│   ├── constants/      # API endpoints and app constants
│   ├── models/         # TypeScript models and types
│   └── service/        # Service classes (API, DB, notifications, etc.)
├── plugin/             # Plugin controller
├── typings/            # Global TypeScript types
├── firebaseConfig.js   # Firebase configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── webpack.config.js   # Webpack configuration
├── package.json        # Project dependencies and scripts
└── README.md           # Project documentation
```

## Configuration

- Edit `firebaseConfig.js` to set up your Firebase project.
- Update `config.ts` for app-specific settings.

## Folder Highlights

- `app/`: Contains global styles and Tailwind CSS setup.
- `src/components/`: Main React components for chat, history, settings, etc.
- `src/constants/ui`: Reusable UI primitives (Button, Dialog, Input, etc.)
- `src/service/`: Handles chat, conversation, file data, and notifications.
- `src/models/`: TypeScript interfaces and models for chat and files.
- `lib/`: Contains utility libraries for common tasks.
- `firebaseConfig.js`: Configuration file for Firebase integration.
- `tailwind.config.js`: Configuration for Tailwind CSS, allowing customization of styles.
- `webpack.config.js`: Webpack configuration for building the plugin.
- `package.json`: Contains project dependencies and scripts for building and running the plugin.

