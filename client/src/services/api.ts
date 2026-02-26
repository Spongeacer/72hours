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
      const data = error.response.data as { error?: string };
      return Promise.reject(data?.error || error.message);
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
  },

  // ==================== AI 叙事（前端直连）====================
  
  // AI 提供商配置
  AI_PROVIDERS: {
    siliconflow: {
      name: 'SiliconFlow',
      apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
      defaultModel: 'Pro/MiniMaxAI/MiniMax-M2.5',
      defaultApiKey: ''
    },
    kimi: {
      name: 'Kimi',
      apiUrl: 'https://api.kimi.com/coding/v1/chat/completions',
      defaultModel: 'k2p5',
      defaultApiKey: ''
    }
  },

  async getAIPrompt(gameId: string): Promise<ApiResponse<{
    prompt: string;
    model: string;
    apiUrl: string;
    provider: string;
  }>> {
    const response = await apiClient.get(`/games/${gameId}/ai-prompt`);
    return response.data;
  },

  // 前端直接调用 AI API（支持多提供商，默认 SiliconFlow）
  async generateNarrative(
    prompt: string,
    provider: 'siliconflow' | 'kimi' = 'siliconflow',
    customApiKey?: string
  ): Promise<string> {
    const config = this.AI_PROVIDERS[provider];
    const apiKey = customApiKey || config.defaultApiKey;
    
    if (!apiKey) {
      throw new Error(`${config.name} API Key 未配置`);
    }
    
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages: [
          { role: 'system', content: '你是一个涌现式叙事引擎。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      throw new Error(`${config.name} API 错误: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || `${config.name} 生成失败`);
    }

    return data.choices[0].message.content.trim();
  }
};
