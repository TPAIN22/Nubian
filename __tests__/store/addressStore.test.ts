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
import useAddressStore from "@/store/addressStore";

const mockedAxios = axiosInstance as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  patch: jest.Mock;
};

const reset = () => {
  useAddressStore.setState({
    addresses: [],
    isLoading: false,
    error: null,
    inFlight: null,
  });
  mockedAxios.get.mockReset();
  mockedAxios.post.mockReset();
  mockedAxios.put.mockReset();
  mockedAxios.delete.mockReset();
  mockedAxios.patch.mockReset();
};

const baseAddress = (overrides: Record<string, any> = {}) => ({
  _id: "a1",
  name: "Home",
  city: "Khartoum",
  area: "Riyadh",
  street: "1",
  building: "12",
  phone: "0912345678",
  isDefault: true,
  ...overrides,
});

describe("addressStore.fetchAddresses", () => {
  beforeEach(reset);

  it("loads array from /addresses", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [baseAddress()] });

    await useAddressStore.getState().fetchAddresses();

    expect(mockedAxios.get).toHaveBeenCalledWith("/addresses");
    expect(useAddressStore.getState().addresses).toHaveLength(1);
    expect(useAddressStore.getState().error).toBeNull();
  });

  it("dedupes concurrent calls via inFlight (only one network round-trip)", async () => {
    let resolveResp: (v: any) => void = () => {};
    mockedAxios.get.mockImplementationOnce(
      () => new Promise((resolve) => { resolveResp = resolve; })
    );

    const p1 = useAddressStore.getState().fetchAddresses();
    const p2 = useAddressStore.getState().fetchAddresses();

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    resolveResp({ data: [baseAddress()] });
    const [r1, r2] = await Promise.all([p1, p2]);
    // Both callers see the same final addresses array.
    expect(r1).toEqual(r2);
  });

  it("on failure, sets a localized error string and rethrows", async () => {
    const err: any = new Error("Network Error");
    err.code = "ERR_NETWORK";
    mockedAxios.get.mockRejectedValueOnce(err);

    await expect(useAddressStore.getState().fetchAddresses()).rejects.toBe(err);

    const error = useAddressStore.getState().error;
    expect(error).toBeTruthy();
    expect(useAddressStore.getState().isLoading).toBe(false);
  });
});

describe("addressStore.addAddress", () => {
  beforeEach(reset);

  it("prepends the new address", async () => {
    useAddressStore.setState({ addresses: [baseAddress({ _id: "a1" })] });
    mockedAxios.post.mockResolvedValueOnce({
      data: baseAddress({ _id: "a2", name: "Work", street: "999" }),
    });

    const result = await useAddressStore
      .getState()
      .addAddress({ name: "Work", street: "999", phone: "0911111111" });

    expect(result._id).toBe("a2");
    const list = useAddressStore.getState().addresses;
    expect(list).toHaveLength(2);
    expect(list[0]._id).toBe("a2");
  });

  it("dedupes by _id when the server returns an existing id", async () => {
    useAddressStore.setState({ addresses: [baseAddress({ _id: "a1" })] });
    mockedAxios.post.mockResolvedValueOnce({
      data: baseAddress({ _id: "a1", name: "Home (updated)" }),
    });

    await useAddressStore
      .getState()
      .addAddress({ name: "Home (updated)" });

    const list = useAddressStore.getState().addresses;
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Home (updated)");
  });

  it("dedupes by composite key (name/city/area/street/building/phone)", async () => {
    useAddressStore.setState({
      addresses: [baseAddress({ _id: "old" })],
    });
    // Server assigned a NEW id but the key matches — should replace, not append.
    mockedAxios.post.mockResolvedValueOnce({
      data: baseAddress({ _id: "new" }),
    });

    await useAddressStore.getState().addAddress(baseAddress());

    const list = useAddressStore.getState().addresses;
    expect(list).toHaveLength(1);
    expect(list[0]._id).toBe("new");
  });

  it("on failure, sets localized error and rethrows", async () => {
    const err: any = new Error("boom");
    err.response = { status: 422, data: { error: { message: "phone is required" } } };
    mockedAxios.post.mockRejectedValueOnce(err);

    await expect(
      useAddressStore.getState().addAddress({ name: "Home" })
    ).rejects.toBe(err);

    expect(useAddressStore.getState().error).toBe("phone is required");
    expect(useAddressStore.getState().isLoading).toBe(false);
  });
});

describe("addressStore.deleteAddress", () => {
  beforeEach(reset);

  it("removes the address optimistically on success", async () => {
    useAddressStore.setState({
      addresses: [
        baseAddress({ _id: "a1" }),
        baseAddress({ _id: "a2", isDefault: false }),
      ],
    });
    mockedAxios.delete.mockResolvedValueOnce({ data: {} });
    // wasDefault path triggers a refetch
    mockedAxios.get.mockResolvedValueOnce({ data: [baseAddress({ _id: "a2" })] });

    await useAddressStore.getState().deleteAddress("a1");

    const list = useAddressStore.getState().addresses;
    expect(list.find((a) => a._id === "a1")).toBeUndefined();
  });
});
