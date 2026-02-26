import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  ApiResponse, 
  GameConfig, 
  Player, 
  NPC, 
  GameState,
  TurnResult,
  SaveData
} from '../types';

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 错误处理拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      return Promise.reject(error.response.data?.error || error.message);
    }
    return Promise.reject('网络错误');
  }
);

export const api = {
  // ==================== 配置 ====================
  
  async getConfig(): Promise<ApiResponse<GameConfig>> {
    const response = await apiClient.get('/config');
    return response.data;
  },

  // ==================== 游戏 ====================
  
  async createGame(
    identity: string, 
    model: string, 
    apiKey?: string
  ): Promise<ApiResponse<{
    gameId: string;
    player: Player;
    bondedNPCs: NPC[];
    opening: string;
    state: GameState;
  }>> {
    const response = await apiClient.post('/games', {
      identity,
      model,
      apiKey
    });
    return response.data;
  },

  async getGameState(gameId: string): Promise<ApiResponse<GameState>> {
    const response = await apiClient.get(`/games/${gameId}/state`);
    return response.data;
  },

  async executeTurn(
    gameId: string, 
    choice?: { id: string; text: string }
  ): Promise<ApiResponse<TurnResult>> {
    const response = await apiClient.post(`/games/${gameId}/turns`, {
      choice
    });
    return response.data;
  },

  async getHistory(gameId: string): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get(`/games/${gameId}/history`);
    return response.data;
  },

  async endGame(gameId: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete(`/games/${gameId}`);
    return response.data;
  },

  // ==================== 存档 ====================
  
  async getSaves(gameId: string): Promise<ApiResponse<SaveData[]>> {
    const response = await apiClient.get(`/games/${gameId}/saves`);
    return response.data;
  },

  async createSave(
    gameId: string, 
    name?: string
  ): Promise<ApiResponse<SaveData>> {
    const response = await apiClient.post(`/games/${gameId}/saves`, {
      name
    });
    return response.data;
  },

  async loadSave(
    gameId: string, 
    saveId: string
  ): Promise<ApiResponse<GameState>> {
    const response = await apiClient.post(`/games/${gameId}/saves/${saveId}/load`);
    return response.data;
  },

  async deleteSave(
    gameId: string, 
    saveId: string
  ): Promise<ApiResponse<null>> {
    const response = await apiClient.delete(`/games/${gameId}/saves/${saveId}`);
    return response.data;
  },

  async exportSave(gameId: string, saveId: string): Promise<string> {
    const response = await apiClient.get(`/games/${gameId}/saves/${saveId}/export`);
    return response.data;
  },

  async importSave(
    gameId: string, 
    saveData: string
  ): Promise<ApiResponse<SaveData>> {
    const response = await apiClient.post(`/games/${gameId}/saves/import`, {
      saveData
    });
    return response.data;
  }
};
