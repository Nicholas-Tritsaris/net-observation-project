import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Frontend Integration Tests', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    const htmlContent = readFileSync(resolve(__dirname, '../../docs/index.html'), 'utf-8');
    dom = new JSDOM(htmlContent, {
      url: 'http://localhost',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
  });

  describe('HTML Structure Validation', () => {
    it('should contain logo-sigil elements', () => {
      const logoElements = document.querySelectorAll('.logo-sigil');
      expect(logoElements.length).toBeGreaterThan(0);
    });

    it('should have logo-sigil--sidebar in sidebar', () => {
      const sidebarLogo = document.querySelector('.sidebar .logo-sigil--sidebar');
      expect(sidebarLogo).toBeTruthy();
    });

    it('should have logo-sigil--header in header', () => {
      const headerLogo = document.querySelector('header .logo-sigil--header');
      expect(headerLogo).toBeTruthy();
    });

    it('should not contain old logo-placeholder class', () => {
      const oldLogo = document.querySelector('.logo-placeholder');
      expect(oldLogo).toBeFalsy();
    });

    it('should not contain old logo-inline class', () => {
      const oldLogo = document.querySelector('.logo-inline');
      expect(oldLogo).toBeFalsy();
    });

    it('should have proper ARIA labels on logo elements', () => {
      const logos = document.querySelectorAll('.logo-sigil');
      logos.forEach(logo => {
        expect(logo.getAttribute('role')).toBe('img');
        expect(logo.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });

  describe('Theme Toggle Integration', () => {
    it('should have theme toggle element', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      expect(toggle).toBeTruthy();
    });

    it('should have theme label element', () => {
      const label = document.querySelector('[data-role="theme-toggle"] [data-label]');
      expect(label).toBeTruthy();
    });

    it('should have proper accessibility attributes on toggle', () => {
      const toggle = document.querySelector('[data-role="theme-toggle"]');
      expect(toggle.getAttribute('role')).toBe('button');
      expect(toggle.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('Navigation Structure', () => {
    it('should have sidebar element', () => {
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).toBeTruthy();
    });

    it('should have sidebar toggle button', () => {
      const toggle = document.querySelector('.sidebar-toggle');
      expect(toggle).toBeTruthy();
    });

    it('should have navigation links', () => {
      const navLinks = document.querySelectorAll('nav a');
      expect(navLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Data Display Elements', () => {
    it('should have stat display elements', () => {
      const stats = document.querySelectorAll('[data-stat]');
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should have table elements for data display', () => {
      const tables = document.querySelectorAll('[data-table]');
      expect(tables.length).toBeGreaterThan(0);
    });
  });

  describe('Settings Panel', () => {
    it('should have settings panel', () => {
      const panel = document.querySelector('.settings-panel');
      expect(panel).toBeTruthy();
    });

    it('should have settings toggle button', () => {
      const toggle = document.querySelector('.settings-toggle');
      expect(toggle).toBeTruthy();
    });

    it('should have form inputs for configuration', () => {
      const backendInput = document.querySelector('[name="backendUrl"]');
      const domainInput = document.querySelector('[name="auth0Domain"]');
      const clientIdInput = document.querySelector('[name="auth0ClientId"]');
      
      expect(backendInput).toBeTruthy();
      expect(domainInput).toBeTruthy();
      expect(clientIdInput).toBeTruthy();
    });
  });
});