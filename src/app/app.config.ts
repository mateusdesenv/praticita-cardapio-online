import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { MENU_REPOSITORY } from './core/repositories/menu.repository';
import { LocalStorageMenuRepository } from './core/repositories/local-storage-menu.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ anchorScrolling: 'enabled' })),
    { provide: MENU_REPOSITORY, useClass: LocalStorageMenuRepository }
  ]
};
