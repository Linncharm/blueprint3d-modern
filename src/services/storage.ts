// Storage Service - Extensible design for local and remote storage
import { simplifyCanvasData, toMinifiedJSON } from './simplify-canvas-data'

export interface FloorplanData {
  id: string
  name: string
  data: string // JSON stringified floorplan data
  thumbnail?: string // Base64 encoded thumbnail image
  createdAt: number
  updatedAt: number
}

export interface IStorageService {
  // Save a floorplan
  saveFloorplan(name: string, data: string, thumbnail?: string): Promise<FloorplanData>

  // Get all floorplans
  getAllFloorplans(): Promise<FloorplanData[]>

  // Get a single floorplan by ID
  getFloorplan(id: string): Promise<FloorplanData | null>

  // Update an existing floorplan
  updateFloorplan(
    id: string,
    name: string,
    data: string,
    thumbnail?: string
  ): Promise<FloorplanData>

  // Delete a floorplan
  deleteFloorplan(id: string): Promise<void>
}

// IndexedDB Implementation (Better for large data storage)
class IndexedDBStorageService implements IStorageService {
  private readonly DB_NAME = 'blueprint3d_db'
  private readonly STORE_NAME = 'floorplans'
  private readonly DB_VERSION = 1
  private dbPromise: Promise<IDBDatabase> | null = null

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' })
          objectStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          objectStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })

    return this.dbPromise
  }

  async saveFloorplan(name: string, data: string, thumbnail?: string): Promise<FloorplanData> {
    const db = await this.getDB()
    const now = Date.now()
    const newFloorplan: FloorplanData = {
      id: `floorplan_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      data,
      thumbnail,
      createdAt: now,
      updatedAt: now
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.add(newFloorplan)

      request.onsuccess = () => resolve(newFloorplan)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllFloorplans(): Promise<FloorplanData[]> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const floorplans = request.result as FloorplanData[]
        resolve(floorplans.sort((a, b) => b.updatedAt - a.updatedAt))
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getFloorplan(id: string): Promise<FloorplanData | null> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async updateFloorplan(
    id: string,
    name: string,
    data: string,
    thumbnail?: string
  ): Promise<FloorplanData> {
    const db = await this.getDB()
    const existing = await this.getFloorplan(id)

    if (!existing) {
      throw new Error(`Floorplan with id ${id} not found`)
    }

    const updatedFloorplan: FloorplanData = {
      ...existing,
      name,
      data,
      thumbnail: thumbnail || existing.thumbnail,
      updatedAt: Date.now()
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.put(updatedFloorplan)

      request.onsuccess = () => resolve(updatedFloorplan)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteFloorplan(id: string): Promise<void> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// Local Storage Implementation (Kept for backward compatibility)
// @ts-ignore
class LocalStorageService implements IStorageService {
  private readonly STORAGE_KEY = 'blueprint3d_floorplans'

  private getFloorplans(): FloorplanData[] {
    const data = localStorage.getItem(this.STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  private setFloorplans(floorplans: FloorplanData[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(floorplans))
    } catch (e) {
      if (
        e instanceof DOMException &&
        (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      ) {
        throw new Error('QUOTA_EXCEEDED')
      }
      throw e
    }
  }

  getStorageInfo(): { used: number; available: number; total: number } {
    let used = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length
      }
    }
    // Most browsers have 5-10MB limit, we assume 5MB
    const total = 5 * 1024 * 1024
    return {
      used,
      available: total - used,
      total
    }
  }

  async saveFloorplan(name: string, data: string, thumbnail?: string): Promise<FloorplanData> {
    const floorplans = this.getFloorplans()
    const now = Date.now()
    const newFloorplan: FloorplanData = {
      id: `floorplan_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      data,
      thumbnail,
      createdAt: now,
      updatedAt: now
    }
    floorplans.push(newFloorplan)
    this.setFloorplans(floorplans)
    return newFloorplan
  }

  async getAllFloorplans(): Promise<FloorplanData[]> {
    return this.getFloorplans().sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async getFloorplan(id: string): Promise<FloorplanData | null> {
    const floorplans = this.getFloorplans()
    return floorplans.find((f) => f.id === id) || null
  }

  async updateFloorplan(
    id: string,
    name: string,
    data: string,
    thumbnail?: string
  ): Promise<FloorplanData> {
    const floorplans = this.getFloorplans()
    const index = floorplans.findIndex((f) => f.id === id)
    if (index === -1) {
      throw new Error(`Floorplan with id ${id} not found`)
    }
    const updatedFloorplan: FloorplanData = {
      ...floorplans[index],
      name,
      data,
      thumbnail: thumbnail || floorplans[index].thumbnail,
      updatedAt: Date.now()
    }
    floorplans[index] = updatedFloorplan
    this.setFloorplans(floorplans)
    return updatedFloorplan
  }

  async deleteFloorplan(id: string): Promise<void> {
    const floorplans = this.getFloorplans()
    const filtered = floorplans.filter((f) => f.id !== id)
    this.setFloorplans(filtered)
  }
}

// Remote Storage Implementation - Uses existing layout API
class RemoteStorageService implements IStorageService {
  private apiUrl: string
  private ensureSessionFn?: () => Promise<boolean>

  constructor(apiUrl: string = '/api/layout', ensureSessionFn?: () => Promise<boolean>) {
    this.apiUrl = apiUrl
    this.ensureSessionFn = ensureSessionFn
  }

  /**
   * 确保用户有有效会话
   * 如果提供了 ensureSessionFn，调用它；否则直接返回 true
   */
  private async ensureSession(): Promise<boolean> {
    if (this.ensureSessionFn) {
      return await this.ensureSessionFn()
    }
    return true
  }

  async saveFloorplan(name: string, data: string, thumbnail?: string): Promise<FloorplanData> {
    // 确保用户已登录（可能是匿名用户）
    const hasSession = await this.ensureSession()
    if (!hasSession) {
      throw new Error('Failed to establish user session')
    }

    // Parse the original canvas data
    const parsedData = JSON.parse(data)

    // Simplify canvas data for LLM consumption
    const simplifiedData = simplifyCanvasData(parsedData)

    // Get minified JSON (this is what should be sent to LLM)
    const minifiedJSONString = toMinifiedJSON(simplifiedData)

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: name,
        canvasData: parsedData, // Original data
        canvasDataSimplified: minifiedJSONString, // Simplified data for LLM
        previewBase64: thumbnail || ''
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to save floorplan' }))
      throw new Error(error.message || 'Failed to save floorplan')
    }

    const result = await response.json()

    // Transform API response to FloorplanData format
    // API returns { code: 200, data: {...}, message: "success" }
    if ((result.success || result.code === 200) && result.data) {
      const apiData = result.data
      return {
        id: apiData.id,
        name: apiData.name,
        data: apiData.canvas_data,
        thumbnail: apiData.preview_url,
        createdAt: new Date(apiData.created_at).getTime(),
        updatedAt: new Date(apiData.updated_at).getTime()
      }
    }

    throw new Error('Failed to save floorplan')
  }

  async getAllFloorplans(): Promise<FloorplanData[]> {
    const response = await fetch(this.apiUrl)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch floorplans' }))
      throw new Error(error.message || 'Failed to fetch floorplans')
    }

    const result = await response.json()

    if ((result.success || result.code === 200) && Array.isArray(result.data)) {
      return result.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        data: item.canvas_data || '{}',
        thumbnail: item.preview_url,
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime()
      }))
    }

    return []
  }

  async getFloorplan(id: string): Promise<FloorplanData | null> {
    const response = await fetch(`${this.apiUrl}/${id}`)

    if (!response.ok) {
      return null
    }

    const result = await response.json()

    if ((result.success || result.code === 200) && result.data) {
      const apiData = result.data
      return {
        id: apiData.id,
        name: apiData.name,
        data: apiData.canvas_data,
        thumbnail: apiData.preview_url,
        createdAt: new Date(apiData.created_at).getTime(),
        updatedAt: new Date(apiData.updated_at).getTime()
      }
    }

    return null
  }

  async updateFloorplan(
    id: string,
    name: string,
    data: string,
    thumbnail?: string
  ): Promise<FloorplanData> {
    // 确保用户已登录（可能是匿名用户）
    const hasSession = await this.ensureSession()
    if (!hasSession) {
      throw new Error('Failed to establish user session')
    }

    // Parse the original canvas data
    const parsedData = JSON.parse(data)

    // Simplify canvas data for LLM consumption
    const simplifiedData = simplifyCanvasData(parsedData)

    // Get minified JSON (this is what should be sent to LLM)
    const minifiedJSONString = toMinifiedJSON(simplifiedData)

    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: name,
        canvasData: parsedData, // Original data
        canvasDataSimplified: minifiedJSONString, // Simplified data for LLM
        previewBase64: thumbnail
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update floorplan')
    }

    const result = await response.json()

    if ((result.success || result.code === 200) && result.data) {
      const apiData = result.data
      return {
        id: apiData.id,
        name: apiData.name,
        data: apiData.canvas_data,
        thumbnail: apiData.preview_url,
        createdAt: new Date(apiData.created_at).getTime(),
        updatedAt: new Date(apiData.updated_at).getTime()
      }
    }

    throw new Error('Invalid response from server')
  }

  async deleteFloorplan(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete floorplan')
    }
  }
}

// Factory to get the appropriate storage service
export function getStorageService(
  forceRemote?: boolean,
  ensureSessionFn?: () => Promise<boolean>
): IStorageService {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Storage service can only be used in browser environment')
  }

  // Check if remote storage should be used
  const useRemote = forceRemote || process.env.NEXT_PUBLIC_USE_REMOTE_STORAGE === 'true'
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/layout'

  if (useRemote) {
    return new RemoteStorageService(apiUrl, ensureSessionFn)
  }

  // Use IndexedDB for local storage (better capacity than localStorage)
  return new IndexedDBStorageService()
}
