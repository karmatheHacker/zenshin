const BACKEND_PORT = 64621 // Default port

if (typeof window !== 'undefined' && !window.api) {
    console.log('Zenshin: Electron API not found, using web mock.')

    window.api = {
        getSettingsJson: async () => {
            try {
                const response = await fetch(`http://localhost:${BACKEND_PORT}/settings`)
                return await response.json()
            } catch (err) {
                console.error('Failed to fetch settings from backend:', err)
                return {
                    uploadLimit: -1,
                    downloadLimit: -1,
                    downloadsFolderPath: '',
                    backendPort: BACKEND_PORT,
                    broadcastDiscordRpc: false,
                    extensionUrls: {}
                }
            }
        },
        saveToSettings: async (key, value) => {
            try {
                await fetch(`http://localhost:${BACKEND_PORT}/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, value })
                })
            } catch (err) {
                console.error('Failed to save settings to backend:', err)
            }
        },
        oauth: (url) => {
            window.open(url, '_blank')
        },
        openFolder: (folder) => {
            console.warn('openFolder is not supported in web mode:', folder)
        },
        minimize: () => {
            console.warn('minimize is not supported in web mode')
        },
        maximize: () => {
            console.warn('maximize is not supported in web mode')
        },
        close: () => {
            console.warn('close is not supported in web mode')
        },
        windowReload: () => {
            window.location.reload()
        },
        changeBackendPort: (port) => {
            console.warn('changeBackendPort is not supported in web mode via IPC')
        },
        setDiscordRpc: (details) => {
            console.warn('Discord RPC is not supported in web mode')
        },
        broadcastDiscordRpc: (value) => {
            console.warn('Discord RPC is not supported in web mode')
        }
    }

    window.electron = {
        receiveDeeplink: (callback) => {
            console.warn('Deeplinks are not supported in web mode')
        }
    }
}
