import { Injectable } from '@angular/core';
import { MenuData } from '../models/menu-data.model';
import { MenuRepository } from './menu.repository';

@Injectable()
export class ApiMenuRepository implements MenuRepository {
  async getMenuData(): Promise<MenuData> {
    throw new Error('ApiMenuRepository será implementado na etapa 2 com Node.js + MongoDB.');
  }

  async saveMenuData(_data: MenuData): Promise<void> {
    throw new Error('ApiMenuRepository será implementado na etapa 2 com Node.js + MongoDB.');
  }

  async exportData(): Promise<MenuData> {
    throw new Error('ApiMenuRepository será implementado na etapa 2 com Node.js + MongoDB.');
  }

  async importData(_data: MenuData): Promise<void> {
    throw new Error('ApiMenuRepository será implementado na etapa 2 com Node.js + MongoDB.');
  }

  async resetToSeed(): Promise<MenuData> {
    throw new Error('ApiMenuRepository será implementado na etapa 2 com Node.js + MongoDB.');
  }

  async clear(): Promise<void> {
    throw new Error('ApiMenuRepository será implementado na etapa 2 com Node.js + MongoDB.');
  }
}
