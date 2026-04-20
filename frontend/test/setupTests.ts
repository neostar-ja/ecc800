import '@testing-library/jest-dom';

// Minimal mock for react-konva components to render in jsdom
import React from 'react';
import { vi } from 'vitest';

const mock = (name: string) => {
  return ({ children, ...props }: any) => React.createElement('div', { 'data-mock': name, ...props }, children);
};

vi.mock('react-konva', () => ({
  Stage: mock('Stage'),
  Layer: mock('Layer'),
  Rect: mock('Rect'),
  Group: mock('Group'),
  Circle: mock('Circle'),
  Line: mock('Line'),
  Text: mock('Text'),
  Path: mock('Path')
}));
