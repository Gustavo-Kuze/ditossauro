/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

declare module '*.png' {
    const value: string;
    export default value;
}
