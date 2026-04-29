import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
  enableProdMode();
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.debug = noop;
}

bootstrapApplication(App, appConfig)
  .catch(err => console.error(err));