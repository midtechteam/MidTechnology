// Detect if running in Tauri
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

// Save file using native dialog
export const saveFileNative = async (
  content: string,
  filename: string,
): Promise<string | null> => {
  if (!isTauri()) {
    // Web fallback: trigger browser download
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return filename
  }
  
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const path = await invoke<string | null>('save_file', { content, filename })
    return path
  } catch (error) {
    console.error('Failed to save file:', error)
    return null
  }
}

// Open file using native dialog
export const openFileNative = async (): Promise<{ path: string; content: string } | null> => {
  if (!isTauri()) return null
  
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const result = await invoke<[string, string] | null>('open_file')
    if (!result) return null
    return { path: result[0], content: result[1] }
  } catch (error) {
    console.error('Failed to open file:', error)
    return null
  }
}

// Save blob as file (for exports)
export const saveBlobNative = async (blob: Blob, filename: string): Promise<void> => {
  const content = await blob.text()
  await saveFileNative(content, filename)
}
