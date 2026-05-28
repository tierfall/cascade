import 'reflect-metadata';
import { IS_PUBLIC_KEY, Public } from './public.decorator.js';

describe('Public decorator', () => {
  it('returns a decorator that attaches IS_PUBLIC_KEY = true on a class', () => {
    @Public()
    class Sample {}
    const value = Reflect.getMetadata(IS_PUBLIC_KEY, Sample) as boolean | undefined;
    expect(value).toBe(true);
  });

  it('returns a decorator that attaches IS_PUBLIC_KEY = true via descriptor on a method', () => {
    const handler = function noop(): void {
      // noop
    };
    const descriptor: PropertyDescriptor = { value: handler };
    Public()({}, 'handler', descriptor);
    const value = Reflect.getMetadata(IS_PUBLIC_KEY, handler) as boolean | undefined;
    expect(value).toBe(true);
  });
});
