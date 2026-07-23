import {
  __resetCartFeedback,
  bumpCartBadge,
  flyToCart,
  getCartTarget,
  setCartTarget,
  showCartConfirmation,
  subscribeBump,
  subscribeConfirmations,
  subscribeFlights,
} from '@/components/cart/cartFeedback';

const RECT = { x: 10, y: 20, width: 40, height: 40 };
const TARGET = { x: 300, y: 700, width: 24, height: 24 };

describe('cartFeedback', () => {
  beforeEach(() => {
    __resetCartFeedback();
  });

  it('stores and returns the cart icon target', () => {
    expect(getCartTarget()).toBeNull();
    setCartTarget(TARGET);
    expect(getCartTarget()).toEqual(TARGET);
  });

  it('emits a flight to every subscriber once both endpoints are known', () => {
    const a = jest.fn();
    const b = jest.fn();
    subscribeFlights(a);
    subscribeFlights(b);
    setCartTarget(TARGET);

    flyToCart({ uri: 'https://cdn/img.jpg', from: RECT });

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    const flight = a.mock.calls[0][0];
    expect(flight).toMatchObject({ uri: 'https://cdn/img.jpg', from: RECT, to: TARGET });
    expect(typeof flight.id).toBe('string');
  });

  it('no-ops when the cart icon has never been laid out', () => {
    const listener = jest.fn();
    subscribeFlights(listener);

    flyToCart({ uri: null, from: RECT });

    expect(listener).not.toHaveBeenCalled();
  });

  it('no-ops when the source rect is unknown', () => {
    const listener = jest.fn();
    subscribeFlights(listener);
    setCartTarget(TARGET);

    flyToCart({ uri: null, from: null });

    expect(listener).not.toHaveBeenCalled();
  });

  it('gives every flight a unique id so rapid adds do not collide', () => {
    const listener = jest.fn();
    subscribeFlights(listener);
    setCartTarget(TARGET);

    flyToCart({ from: RECT });
    flyToCart({ from: RECT });
    flyToCart({ from: RECT });

    const ids = listener.mock.calls.map(([f]) => f.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('stops delivering after unsubscribe', () => {
    const listener = jest.fn();
    const off = subscribeFlights(listener);
    setCartTarget(TARGET);

    off();
    flyToCart({ from: RECT });

    expect(listener).not.toHaveBeenCalled();
  });

  it('never lets one broken listener block the others', () => {
    const bad = jest.fn(() => {
      throw new Error('boom');
    });
    const good = jest.fn();
    subscribeFlights(bad);
    subscribeFlights(good);
    setCartTarget(TARGET);

    expect(() => flyToCart({ from: RECT })).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);
  });

  it('emits confirmations with a generated id', () => {
    const listener = jest.fn();
    subscribeConfirmations(listener);

    showCartConfirmation({ title: 'Added to cart', subtitle: 'Shoe', uri: null });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toMatchObject({
      title: 'Added to cart',
      subtitle: 'Shoe',
      uri: null,
    });
    expect(listener.mock.calls[0][0].id).toBeTruthy();
  });

  it('broadcasts badge bumps', () => {
    const listener = jest.fn();
    subscribeBump(listener);

    bumpCartBadge();
    bumpCartBadge();

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
