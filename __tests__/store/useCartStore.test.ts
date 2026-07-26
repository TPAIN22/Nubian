/**
 * `useCartStore.fetchCart` failure semantics.
 *
 * The cart is a persisted store (`nubian-cart-v1`, partialized to `cart`), so
 * anything that writes `cart: null` also destroys the offline copy in
 * AsyncStorage. `fetchCart` used to do exactly that on *every* failure, which
 * meant one unauthenticated refresh — a Clerk token that hadn't finished
 * refreshing when the user came back from checkout — permanently emptied the
 * cart until the next successful write echoed the server's real contents back.
 *
 * These tests pin the distinction: a 404 is the only answer that authoritatively
 * says "this user has no cart". Everything else must leave the cart alone.
 */

jest.mock("@/services/api/client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

import axiosInstance from "@/services/api/client";
import useCartStore from "@/store/useCartStore";

const mockedAxios = axiosInstance as unknown as { get: jest.Mock };

const cartWith = (quantity = 2) => ({
  _id: "cart1",
  products: [{ product: { _id: "p1" }, quantity, attributes: {} }],
  totalQuantity: quantity,
  totalPrice: 100,
});

const httpError = (status: number, message = "boom") => {
  const err: any = new Error(message);
  err.isAxiosError = true;
  err.response = { status, data: { error: { message } } };
  return err;
};

/** A transport failure — no `response` at all (timeout / DNS / offline). */
const networkError = () => {
  const err: any = new Error("Network error");
  err.isAxiosError = true;
  err.code = "ERR_NETWORK";
  return err;
};

const seed = (cart: any) => {
  useCartStore.setState({
    cart,
    isLoading: false,
    error: null,
    inFlight: null,
    updatingKeys: {},
    isUpdating: false,
    isCouponPending: false,
  });
};

beforeEach(() => {
  mockedAxios.get.mockReset();
  seed(null);
});

describe("fetchCart — success", () => {
  it("replaces the cart with the server copy", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: cartWith(3) });

    await useCartStore.getState().fetchCart();

    expect(mockedAxios.get).toHaveBeenCalledWith("/carts");
    expect(useCartStore.getState().cart?.totalQuantity).toBe(3);
    expect(useCartStore.getState().error).toBeNull();
    expect(useCartStore.getState().isLoading).toBe(false);
  });

  it("unwraps a { data } envelope", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { data: cartWith(1) } });

    await useCartStore.getState().fetchCart();

    expect(useCartStore.getState().cart?.totalQuantity).toBe(1);
  });
});

describe("fetchCart — 404 is the only authoritative empty", () => {
  it("clears the cart and reports no error", async () => {
    seed(cartWith(2));
    mockedAxios.get.mockRejectedValueOnce(httpError(404));

    await useCartStore.getState().fetchCart();

    expect(useCartStore.getState().cart).toBeNull();
    expect(useCartStore.getState().error).toBeNull();
    expect(useCartStore.getState().isLoading).toBe(false);
  });
});

describe("fetchCart — failures must not destroy the persisted cart", () => {
  // The exact regression: back from checkout, the cached Clerk token had
  // expired, the refresh lost the race, the request went out with no
  // Authorization header, and the 401 emptied the cart.
  it("keeps the cart on 401 and surfaces the error", async () => {
    seed(cartWith(2));
    mockedAxios.get.mockRejectedValueOnce(
      httpError(401, "Authentication required.")
    );

    await expect(useCartStore.getState().fetchCart()).rejects.toBeTruthy();

    expect(useCartStore.getState().cart).toEqual(cartWith(2));
    expect(useCartStore.getState().error).toBe("Authentication required.");
    expect(useCartStore.getState().isLoading).toBe(false);
  });

  it("keeps the cart on a network error / timeout", async () => {
    seed(cartWith(4));
    mockedAxios.get.mockRejectedValueOnce(networkError());

    await expect(useCartStore.getState().fetchCart()).rejects.toBeTruthy();

    expect(useCartStore.getState().cart?.totalQuantity).toBe(4);
    expect(useCartStore.getState().error).toBeTruthy();
  });

  it("keeps the cart on a 5xx", async () => {
    seed(cartWith(1));
    mockedAxios.get.mockRejectedValueOnce(httpError(500, "server exploded"));

    await expect(useCartStore.getState().fetchCart()).rejects.toBeTruthy();

    expect(useCartStore.getState().cart?.totalQuantity).toBe(1);
  });

  it("leaves an already-empty cart empty rather than inventing one", async () => {
    seed(null);
    mockedAxios.get.mockRejectedValueOnce(httpError(401));

    await expect(useCartStore.getState().fetchCart()).rejects.toBeTruthy();

    expect(useCartStore.getState().cart).toBeNull();
    // The cart screen keys its retry state off `error` + an empty cart, so the
    // error has to be set for the user to get a retry instead of the cheerful
    // "your cart is empty" illustration.
    expect(useCartStore.getState().error).toBeTruthy();
  });
});

describe("fetchCart — in-flight dedupe", () => {
  it("reuses a single request for concurrent callers", async () => {
    mockedAxios.get.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: cartWith(2) }), 5)
        )
    );

    await Promise.all([
      useCartStore.getState().fetchCart(),
      useCartStore.getState().fetchCart(),
    ]);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(useCartStore.getState().cart?.totalQuantity).toBe(2);
  });
});
