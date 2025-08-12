const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const { convertModels } = require("./convertModels");

jest.mock("fs");
jest.mock("child_process");
jest.mock("path");

describe("convertModels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.readdirSync.mockImplementation((dir) => {
      if (dir === "./3DModels") return ["Car", "Empty", "Nested"];
      if (dir === "./3DModels/Empty") return [];
      if (dir === "./3DModels/Nested") return ["Sub"];
      if (dir === "./3DModels/Nested/Sub") return [];
      return [];
    });
    fs.statSync.mockImplementation((p) => ({
      isDirectory: () => !p.endsWith(".gltf") && !p.endsWith(".glb"),
    }));
    fs.existsSync.mockImplementation((p) => {
      if (p.endsWith("Car/scene.gltf")) return true;
      if (p.endsWith("ModelDefinitions/Car.tsx")) return false;
      if (p.endsWith("ModelDefinitions/Nested-Sub.tsx")) return false;
      return false;
    });
    fs.readFileSync.mockReturnValue("export function Model() {}");
    fs.writeFileSync.mockImplementation(() => {});
    child_process.execSync.mockImplementation(() => {});
    path.join.mockImplementation((...args) => args.join("/"));
  });

  it("should convert a model if .gltf exists", () => {
    convertModels({ modelsDir: "./3DModels", outputDir: "./ModelDefinitions" });
    expect(child_process.execSync).toHaveBeenCalledWith(
      expect.stringContaining('npx gltfjsx "./3DModels/Car/scene.gltf"')
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "./ModelDefinitions/Car.tsx",
      expect.any(String)
    );
  });

  it("should skip empty folders", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    convertModels({ modelsDir: "./3DModels", outputDir: "./ModelDefinitions" });
    expect(logSpy).toHaveBeenCalledWith("ℹ️ ./3DModels/Empty is empty");
    logSpy.mockRestore();
  });

  it("should handle nested subfolders", () => {
    fs.existsSync.mockImplementation((p) => {
      if (p.endsWith("Nested/Sub/scene.gltf")) return true;
      if (p.endsWith("ModelDefinitions/Nested-Sub.tsx")) return false;
      return false;
    });
    convertModels({ modelsDir: "./3DModels", outputDir: "./ModelDefinitions" });
    expect(child_process.execSync).toHaveBeenCalledWith(
      expect.stringContaining('npx gltfjsx "./3DModels/Nested/Sub/scene.gltf"')
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "./ModelDefinitions/Nested-Sub.tsx",
      expect.any(String)
    );
  });

  it("should skip already converted models", () => {
    fs.existsSync.mockImplementation((p) => {
      if (p.endsWith("Car/scene.gltf")) return true;
      if (p.endsWith("ModelDefinitions/Car.tsx")) return true;
      return false;
    });
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    convertModels({ modelsDir: "./3DModels", outputDir: "./ModelDefinitions" });
    expect(logSpy).toHaveBeenCalledWith("🚫 Skipped ./3DModels/Car");
    logSpy.mockRestore();
  });
});
