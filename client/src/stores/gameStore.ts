import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  GameState, 
  Player, 
  NPC,
  Choice,
  SaveData 
} from '../types';
import { api } from '../services/api';

interface GameStore {
  // 状态
  gameId: string | null;
  gameState: GameState | null;
  player: Player | null;
  npcs: NPC[];
  currentNarrative: string;
  currentChoices: Choice[];
  currentResult: string | null;
  isLoading: boolean;
  error: string | null;
  saves: SaveData[];
  
  // 动作
  initGame: (identity: string, model: string, apiKey?: string) => Promise<void>;
  makeChoice: (choice?: Choice) => Promise<void>;
  loadSaves: () => Promise<void>;
  createSave: (name?: string) => Promise<void>;
  loadSave: (saveId: string) => Promise<void>;
  reset: () => void;
  setError: (error: string | null) => void;
}

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      gameId: null,
      gameState: null,
      player: null,
      npcs: [],
      currentNarrative: '',
      currentChoices: [],
      currentResult: null,
      isLoading: false,
      error: null,
      saves: [],

      // 初始化游戏
      initGame: async (identity, model, apiKey) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.createGame(identity, model, apiKey);
          
          if (!response.success || !response.data) {
            throw new Error(response.error?.message || '创建游戏失败');
          }

          const { gameId, player, bondedNPCs, opening, state } = response.data;
          
          set({
            gameId,
            player,
            npcs: bondedNPCs,
            gameState: state,
            currentNarrative: opening,
            isLoading: false
          });

          // 自动开始第一回合
          await get().makeChoice();
          
        } catch (err: any) {
          set({ 
            error: err.message || '初始化游戏失败', 
            isLoading: false 
          });
        }
      },

      // 做出选择
      makeChoice: async (choice?) => {
        const { gameId, gameState } = get();
        
        if (!gameId || !gameState) return;
        
        set({ isLoading: true, error: null, currentResult: null });
        
        try {
          const response = await api.executeTurn(gameId, choice);
          
          if (!response.success || !response.data) {
            throw new Error(response.error?.message || '执行回合失败');
          }

          const result = response.data;
          
          set({
            gameState: result.state,
            currentNarrative: result.narrative,
            currentChoices: result.choices,
            currentResult: null,
            isLoading: false
          });

          // 如果游戏结束，显示结局
          if (result.state?.isGameOver) {
            // 可以在这里处理游戏结束逻辑
          }
          
        } catch (err: any) {
          set({ 
            error: err.message || '执行选择失败', 
            isLoading: false 
          });
        }
      },

      // 加载存档列表
      loadSaves: async () => {
        const { gameId } = get();
        if (!gameId) return;
        
        try {
          const response = await api.getSaves(gameId);
          if (response.success && response.data) {
            set({ saves: response.data });
          }
        } catch (err: any) {
          console.error('加载存档失败:', err);
        }
      },

      // 创建存档
      createSave: async (name) => {
        const { gameId } = get();
        if (!gameId) return;
        
        try {
          const response = await api.createSave(gameId, name);
          if (response.success) {
            await get().loadSaves();
          }
        } catch (err: any) {
          set({ error: err.message || '存档失败' });
        }
      },

      // 读取存档
      loadSave: async (saveId) => {
        const { gameId } = get();
        if (!gameId) return;
        
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.loadSave(gameId, saveId);
          
          if (!response.success || !response.data) {
            throw new Error(response.error?.message || '读档失败');
          }

          // 从存档恢复游戏状态
          const state = response.data;
          set({
            gameState: state,
            isLoading: false
          });
          
        } catch (err: any) {
          set({ 
            error: err.message || '读档失败', 
            isLoading: false 
          });
        }
      },

      // 重置状态
      reset: () => {
        set({
          gameId: null,
          gameState: null,
          player: null,
          npcs: [],
          currentNarrative: '',
          currentChoices: [],
          currentResult: null,
          isLoading: false,
          error: null,
          saves: []
        });
      },

      // 设置错误
      setError: (error) => {
        set({ error });
      }
    }),
    { name: 'GameStore' }
  )
);
