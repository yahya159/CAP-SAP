import { describe, it, expect } from 'vitest';

describe('Hello World Functionality', () => {
    it('should return "Hello, World!"', () => {
        const helloWorld = () => 'Hello, World!';
        expect(helloWorld()).toBe('Hello, World!');
    });
});