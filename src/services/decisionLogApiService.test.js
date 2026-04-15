import axios from "axios";
import { decisionLogApiService } from "./decisionLogApiService";

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe("decisionLogApiService", () => {
  beforeEach(() => {
    sessionStorage.setItem("token", "test-token");
    jest.clearAllMocks();
  });

  test("getProjectLogs calls decision log endpoint with params", async () => {
    axios.get.mockResolvedValue({ data: { logs: [], total: 0 } });

    const projectId = "67f4fddf447f6cb03c95f001";
    const params = { limit: 10, skip: 0, sort_order: "desc" };
    const response = await decisionLogApiService.getProjectLogs(projectId, params);

    expect(response).toEqual({ logs: [], total: 0 });
    expect(axios.get).toHaveBeenCalledWith(
      `${process.env.REACT_APP_BACKEND_URL}/api/decision-logs/${projectId}/logs`,
      expect.objectContaining({ params })
    );
  });
});
