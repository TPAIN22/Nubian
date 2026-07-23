import { classifyCartError } from '@/components/cart/cartErrors';

describe('classifyCartError', () => {
  it('falls back to generic for null/undefined', () => {
    expect(classifyCartError(null)).toBe('generic');
    expect(classifyCartError(undefined)).toBe('generic');
  });

  it('maps 401/403 to auth', () => {
    expect(classifyCartError({ response: { status: 401 } })).toBe('auth');
    expect(classifyCartError({ response: { status: 403 } })).toBe('auth');
  });

  it('maps 409 to stock', () => {
    expect(classifyCartError({ response: { status: 409 } })).toBe('stock');
  });

  it('prefers the HTTP status over message text', () => {
    // A 500 whose body mentions the network is still a server failure.
    expect(
      classifyCartError({
        response: { status: 500 },
        message: 'network write failed',
      }),
    ).toBe('generic');
  });

  it('detects axios network failures', () => {
    expect(classifyCartError({ code: 'ERR_NETWORK', message: 'Network Error' })).toBe(
      'network',
    );
    expect(classifyCartError({ code: 'ECONNABORTED', message: 'timeout' })).toBe(
      'network',
    );
    expect(classifyCartError({ request: {}, message: 'no response' })).toBe('network');
  });

  it('classifies the bare message strings the store keeps in state.error', () => {
    expect(classifyCartError('Not enough stock for this variant')).toBe('stock');
    expect(classifyCartError('Unauthorized')).toBe('auth');
    expect(classifyCartError('Request timeout')).toBe('network');
    expect(classifyCartError('Failed to add product to cart.')).toBe('generic');
  });

  it('handles a real Error instance', () => {
    expect(classifyCartError(new Error('Sold out'))).toBe('stock');
    expect(classifyCartError(new Error('Something odd'))).toBe('generic');
  });
});
