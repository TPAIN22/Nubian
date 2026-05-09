jest.mock("@/services/api/client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import axiosInstance from "@/services/api/client";
import useOrderStore from "@/store/orderStore";

const mockedAxios = axiosInstance as unknown as {
  get: jest.Mock;
  post: jest.Mock;
};

const reset = () => {
  useOrderStore.setState({
    orders: [],
    selectedOrder: null,
    isLoading: false,
    error: null,
  });
  mockedAxios.get.mockReset();
  mockedAxios.post.mockReset();
};

describe("orderStore.createOrder", () => {
  beforeEach(reset);

  it("posts to /orders and returns the created order", async () => {
    const order = { _id: "o1", orderNumber: "1001", status: "pending", total: 999 };
    mockedAxios.post.mockResolvedValueOnce({ data: order });

    const result = await useOrderStore.getState().createOrder({
      addressId: "a1",
      paymentMethod: "CASH",
      items: [{ productId: "p1", quantity: 2 }],
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/orders",
      expect.objectContaining({ addressId: "a1", paymentMethod: "CASH" }),
      expect.any(Object)
    );
    expect(result).toEqual(order);
    expect(useOrderStore.getState().orders[0]).toEqual(order);
    expect(useOrderStore.getState().isLoading).toBe(false);
  });

  it("forwards the idempotency key as a header and strips it from the body", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { _id: "o2", status: "pending" } });

    await useOrderStore.getState().createOrder({
      paymentMethod: "BANKAK",
      items: [{ productId: "p1", quantity: 1 }],
      idempotencyKey: "key-abc-123",
    });

    const [, body, opts] = mockedAxios.post.mock.calls[0];
    expect(body).not.toHaveProperty("idempotencyKey");
    expect(opts.headers).toEqual({ "Idempotency-Key": "key-abc-123" });
  });

  it("on failure: surfaces a localized error and rethrows", async () => {
    const err: any = new Error("boom");
    err.response = { status: 422, data: { error: { message: "phone is required" } } };
    mockedAxios.post.mockRejectedValueOnce(err);

    await expect(
      useOrderStore.getState().createOrder({
        paymentMethod: "CASH",
        items: [{ productId: "p1", quantity: 1 }],
      })
    ).rejects.toBe(err);

    expect(useOrderStore.getState().error).toBe("phone is required");
    expect(useOrderStore.getState().isLoading).toBe(false);
  });
});

describe("orderStore.getUserOrders", () => {
  beforeEach(reset);

  it("loads orders array from /orders/my-orders", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ _id: "o1", status: "pending" }],
    });

    await useOrderStore.getState().getUserOrders();

    expect(mockedAxios.get).toHaveBeenCalledWith("/orders/my-orders");
    expect(useOrderStore.getState().orders).toHaveLength(1);
  });

  it("supports {orders: [...]} response envelope", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { orders: [{ _id: "o1", status: "pending" }] },
    });
    await useOrderStore.getState().getUserOrders();
    expect(useOrderStore.getState().orders).toHaveLength(1);
  });

  it("on network failure, sets error and clears loading", async () => {
    const err: any = new Error("Network Error");
    err.code = "ERR_NETWORK";
    mockedAxios.get.mockRejectedValueOnce(err);

    await useOrderStore.getState().getUserOrders();

    expect(useOrderStore.getState().error).toBeTruthy();
    expect(useOrderStore.getState().isLoading).toBe(false);
  });
});
