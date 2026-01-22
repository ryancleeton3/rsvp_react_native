# RSVP React Native Reader

A minimal, high-efficiency Rapid Serial Visual Presentation (RSVP) reader built with React Native and Expo. This app allows users to import PDFs, extract text locally using native libraries, and read using speed-reading techniques (Pivot/Spritz mode or Chunking).

## Features

-   **Import PDFs**: Copies files to a secure internal library.
-   **Native Text Extraction**: Extracts text instantly without network calls or OCR (using `expo-pdf-text-extract`).
-   **RSVP Reading Engine**:
    -   **Variable WPM**: Adjustable speed from 100 to 1000+ WPM.
    -   **Chunk Size**: Read 1 word (Pivot Mode) or multiple words (Centered Mode).
-   **Library Management**: Persistent storage for your books.
-   **Resume Progress**: Remembers exactly where you left off.

## Prerequisites

Before running this project, ensure you have the following installed:

-   **Node.js**: (LTS recommended)
-   **Watchman**: `brew install watchman` (macOS)
-   **Xcode**: Required for iOS Simulator (macOS only).
-   **Android Studio**: Required for Android Emulator (optional).

## Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd rsvp_react_native
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## Running the App

> [!IMPORTANT]
> This app uses **Native Modules** (`expo-pdf-text-extract`, `expo-file-system`). It **will not working** in the standard "Expo Go" app from the App Store. You must build a **Development Client**.

### iOS (macOS only)
1.  Start the simulator and build the native app:
    ```bash
    npx expo run:ios
    ```
    *This command will install CocoaPods and build the iOS app locally. It may take a few minutes the first time.*

### Android
1.  Start your Android Emulator or connect a device.
2.  Build and run:
    ```bash
    npx expo run:android
    ```

## Troubleshooting

-   **Orientation Issues**: If the app orientation feels locked or wrong, restart the metro bundler (press `r` in the terminal) after changing native config.
-   **Missing Modules**: If you see errors about "Native module not found", ensure you are running the command `npx expo run:ios` (Prebuild) and NOT just `npx expo start`.
-   **FileSystem Deprecation**: The app uses `expo-file-system/legacy` intentionally to avoid breaking changes in the latest Expo SDK 52+.

## Project Structure

-   `app/`: Main application screens (Expo Router).
-   `components/`: Reusable UI components (`RSVPReader`, `ReaderPDFViewer`).
-   `hooks/`: Custom logic (`useRSVP` for reading engine).
-   `utils/`: Helper functions (`storage.ts` for file system management).
