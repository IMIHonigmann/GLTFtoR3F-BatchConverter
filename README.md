# GLTF to JSX Batch Converter

A CLI tool that watches a folder of GLTF files and generates ready-to-use **JSX** components for use with **react-three-fiber (R3F)**. Conversion is handled by the gltfjsx library.

> If you frequently convert many GLTF models to JSX, this script automates the repetitive parts and creates components you can import right away.

---

## Features

- Watches a models directory for new GLTF/GLB files.
- Automatically generates JSX components for models that don't already have one.
- Adds a few conveniences so the output is immediately usable in R3F.

---

## Installation

You can run the tool with `npx` (no global install required):

```bash
npx convert-models --modelsDir=/path/to/your/models --outputDir=/path/to/your/components
```

### Options

- `--modelsDir` — path to the folder containing your GLTF/GLB model folders.
- `--outputDir` — path where the generated JSX components should be written.

> Note: Flag names are case-sensitive in some environments. Use `--modelsDir` and `--outputDir` (camelCase) as shown above.

---

## Recommended project script

Add a script to your `package.json` to make running it easier:

```json
// package.json
{
  "scripts": {
    "convert-models": "convert-models --modelsDir=./3DModels --outputDir=./ModelDefinitions",
    "dev": "npm run convert-models && vite"
  }
}
```

Running `npm run dev` (or your dev command) is a valid option — the converter runs first and adds components if needed without noticeable startup cost.

---

## Folder structure and limitations

This tool is intentionally opinionated to reduce accidental complexity. Please note:

- **You must create the folders you pass to the tool beforehand.** The tool will not create missing root folders automatically to avoid accidentally modifying your project structure.

- **Single subdirectory level supported per model folder.** The converter supports one level of subdirectories inside each model folder. Deeper nesting will be ignored.

**This works:**

```
modelsDir/
  Gun/
    Base/
    Magazine/
    Scope/
```

**This will be ignored for nested deeper than one level:**

```
modelsDir/
  Gun/
    Base/
      Scope/   <-- this nested folder will be ignored
    Magazine/
```

**Any subfolder where a gltf/glb file exists on the same level will also be ignored:**

```
modelsDir/
  Gun/
    scene.gltf <-- scene file on the same level as the subfolder Base
    Base/ <-- Base will not be checked
    Scope/
    Magazine/
```

This restriction keeps generated outputs predictable and the folder structure maintainable.

---

## Usage examples

Convert a local folder to JSX components:

```bash
npx convert-models --modelsDir=./3DModels --outputDir=./ModelDefinitions
```

Windows example (PowerShell):

```powershell
npx convert-models --modelsDir=.\3DModels --outputDir=.\ModelDefinitions
```

---

## Troubleshooting

- **Nothing was generated:** Make sure both `--modelsDir` and `--outputDir` exist and that the models folder contains `.gltf` or `.glb` files.
- **Some subfolders ignored:** Check that your models follow the supported single-subdirectory convention.
- **Permission errors:** Ensure your user account has write permission to the `--outputDir`.

If you still have trouble, please share an example of your folder structure and the exact command you used.

---

## Who is this for?

- Developers who need to dynamically import many 3D models in a R3F project.
- People who iterate quickly on multiple models and want automated JSX outputs.

---

## Contributing

Contributions, bug reports and feature requests are welcome. Please open an issue or a pull request with a clear description of the problem or enhancement.

---

# Example: Dynamic import in a Vite React component

```tsx
import React, { Suspense, lazy, useMemo } from "react";
import { Canvas } from "@react-three/fiber";

type Props = {
  weaponId?: number | null;
};

// Example shape: { '../ModelDefinitions/1.tsx': () => import('../ModelDefinitions/1') }
declare const weaponModules: Record<string, () => Promise<any>>;

function CustomizerScene({ weaponId }: Props) {
  const WeaponModel = useMemo(() => {
    if (!weaponId && weaponId !== 0) return null;

    const path = `../ModelDefinitions/${weaponId}.tsx`;
    const moduleLoader = weaponModules[path];

    if (!moduleLoader) return null;

    return lazy(async () => {
      const mod = await moduleLoader();
      const Component =
        mod.default ??
        mod[weaponId] ??
        mod[`mainSubfolderName-${weaponId}`] ??
        (() => null);
      return { default: Component };
    });
  }, [weaponId]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minWidth: 800,
        minHeight: 600,
        margin: "auto",
        backgroundColor: "#151517",
      }}
    >
      <Suspense fallback={null}>
        <Canvas shadows>{WeaponModel ? <WeaponModel /> : null}</Canvas>
      </Suspense>
    </div>
  );
}

export default CustomizerScene;
```

### Notes

- The example assumes you have a `weaponModules` map that returns a dynamic `import()` function for each generated component path. How you create that map depends on your bundler (Vite, Webpack, etc.).
- If you want a more detailed example check out my project [Soushakaze](https://github.com/IMIHonigmann/soushakaze-app) which makes heavy use of this npm package.
