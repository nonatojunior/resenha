import type { GameRepository } from '../types/game';
import { DemoRepository } from './demoRepository';
import { SupabaseRepository } from './supabaseRepository';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let repositoryInstance: GameRepository | null = null;

export function getRepository(): GameRepository {
  if (repositoryInstance) return repositoryInstance;

  if (isSupabaseConfigured) {
    try {
      repositoryInstance = new SupabaseRepository(supabaseUrl, supabaseAnonKey);
      return repositoryInstance;
    } catch (error) {
      console.error('Configuração do Supabase inválida. Usando o modo demonstração local.', error);
    }
  }

  repositoryInstance = new DemoRepository();
  return repositoryInstance;
}

export { DemoRepository, SupabaseRepository };
