/**
 * Utility Functions Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('base-class', 'additional-class');
    expect(result).toBe('base-class additional-class');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;

    const result = cn(
      'base',
      isActive && 'active',
      isDisabled && 'disabled'
    );

    expect(result).toBe('base active');
  });

  it('merges Tailwind classes correctly', () => {
    const result = cn('px-4 py-2', 'px-8');
    expect(result).toBe('py-2 px-8');
  });

  it('handles undefined and null values', () => {
    const result = cn('base', undefined, null, 'valid');
    expect(result).toBe('base valid');
  });

  it('handles empty strings', () => {
    const result = cn('base', '', 'another');
    expect(result).toBe('base another');
  });

  it('handles arrays of classes', () => {
    const result = cn('base', ['array-class-1', 'array-class-2']);
    expect(result).toBe('base array-class-1 array-class-2');
  });

  it('handles objects with boolean values', () => {
    const result = cn('base', {
      active: true,
      disabled: false,
      'hover:bg-gray-100': true,
    });
    expect(result).toBe('base active hover:bg-gray-100');
  });

  it('properly resolves conflicting Tailwind classes', () => {
    // Later classes should override earlier ones
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');

    const result2 = cn('bg-primary text-white', 'bg-secondary');
    expect(result2).toBe('text-white bg-secondary');
  });

  it('handles complex combinations', () => {
    const variant = 'primary';
    const size = 'lg';
    const disabled = false;

    const result = cn(
      'inline-flex items-center justify-center',
      {
        'bg-primary text-white': variant === 'primary',
        'bg-secondary text-black': variant === 'secondary',
      },
      {
        'h-8 px-3 text-sm': size === 'sm',
        'h-10 px-4 text-base': size === 'md',
        'h-12 px-6 text-lg': size === 'lg',
      },
      disabled && 'opacity-50 cursor-not-allowed'
    );

    expect(result).toContain('inline-flex');
    expect(result).toContain('bg-primary');
    expect(result).toContain('text-white');
    expect(result).toContain('h-12');
    expect(result).toContain('px-6');
    expect(result).toContain('text-lg');
    expect(result).not.toContain('opacity-50');
  });
});
