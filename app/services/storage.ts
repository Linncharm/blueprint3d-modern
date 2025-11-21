// Storage Service - Extensible design for local and remote storage

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
  updateFloorplan(id: string, name: string, data: string, thumbnail?: string): Promise<FloorplanData>

  // Delete a floorplan
  deleteFloorplan(id: string): Promise<void>
}

// Local Storage Implementation (Phase 1)
class LocalStorageService implements IStorageService {
  private readonly STORAGE_KEY = 'blueprint3d_floorplans'

  private getFloorplans(): FloorplanData[] {
    const data = localStorage.getItem(this.STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  private setFloorplans(floorplans: FloorplanData[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(floorplans))
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
      updatedAt: now,
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
    return floorplans.find(f => f.id === id) || null
  }

  async updateFloorplan(id: string, name: string, data: string, thumbnail?: string): Promise<FloorplanData> {
    const floorplans = this.getFloorplans()
    const index = floorplans.findIndex(f => f.id === id)
    if (index === -1) {
      throw new Error(`Floorplan with id ${id} not found`)
    }
    const updatedFloorplan: FloorplanData = {
      ...floorplans[index],
      name,
      data,
      thumbnail: thumbnail || floorplans[index].thumbnail,
      updatedAt: Date.now(),
    }
    floorplans[index] = updatedFloorplan
    this.setFloorplans(floorplans)
    return updatedFloorplan
  }

  async deleteFloorplan(id: string): Promise<void> {
    const floorplans = this.getFloorplans()
    const filtered = floorplans.filter(f => f.id !== id)
    this.setFloorplans(filtered)
  }
}

// Remote Storage Implementation (Phase 2 - placeholder)
class RemoteStorageService implements IStorageService {
  private apiUrl: string

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl
  }

  async saveFloorplan(name: string, data: string, thumbnail?: string): Promise<FloorplanData> {
    const response = await fetch(`${this.apiUrl}/floorplans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data, thumbnail }),
    })
    return response.json()
  }

  async getAllFloorplans(): Promise<FloorplanData[]> {
    const response = await fetch(`${this.apiUrl}/floorplans`)
    return response.json()
  }

  async getFloorplan(id: string): Promise<FloorplanData | null> {
    const response = await fetch(`${this.apiUrl}/floorplans/${id}`)
    if (!response.ok) return null
    return response.json()
  }

  async updateFloorplan(id: string, name: string, data: string, thumbnail?: string): Promise<FloorplanData> {
    const response = await fetch(`${this.apiUrl}/floorplans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data, thumbnail }),
    })
    return response.json()
  }

  async deleteFloorplan(id: string): Promise<void> {
    await fetch(`${this.apiUrl}/floorplans/${id}`, {
      method: 'DELETE',
    })
  }
}

// Factory to get the appropriate storage service
export function getStorageService(): IStorageService {
  // For Phase 1, use local storage
  // For Phase 2, check config or env variable and return RemoteStorageService
  const useRemote = process.env.NEXT_PUBLIC_USE_REMOTE_STORAGE === 'true'
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''

  if (useRemote && apiUrl) {
    return new RemoteStorageService(apiUrl)
  }

  return new LocalStorageService()
}
