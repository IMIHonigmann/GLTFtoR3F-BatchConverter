#!/usr/bin/env node

const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

function getArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    if (key && value) args[key] = value;
  });
  return args;
}

function convertModels({
  modelsDir = "./3DModels",
  outputDir = "./ModelDefinitions",
} = {}) {
  fs.readdirSync(modelsDir).forEach((folder) => {
    const folderPath = path.join(modelsDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) return;
    const gltf = path.join(folderPath, "scene.gltf");
    const glb = path.join(folderPath, "scene.glb");
    let glFile = fs.existsSync(gltf) ? gltf : fs.existsSync(glb) ? glb : null;

    if (fs.existsSync(`${outputDir}/${folder}.tsx`)) {
      console.log(`🚫 Skipped ${modelsDir}/${folder}`);
      return;
    }
    if (!glFile) {
      console.log(`ℹ️ ${modelsDir}/${folder} is empty`);
      fs.readdirSync(`${modelsDir}/${folder}`).forEach((subfolder) => {
        const subFolderPath = path.join(modelsDir, folder, subfolder);
        if (!fs.statSync(subFolderPath).isDirectory()) return;
        const subGltf = path.join(modelsDir, folder, subfolder, "scene.gltf");
        const subGlb = path.join(modelsDir, folder, subfolder, "scene.glb");
        let subGlFile = fs.existsSync(subGltf)
          ? subGltf
          : fs.existsSync(subGlb)
          ? subGlb
          : null;
        if (fs.existsSync(`${outputDir}/${folder}.tsx`)) {
          console.log(`🚫 Skipped ${modelsDir}/${folder}`);
          return;
        }
        const subFolderFileName = `${folder}-${subfolder}`;

        if (fs.existsSync(`${outputDir}/${subFolderFileName}.tsx`)) {
          console.log(`🚫 Skipped ${modelsDir}/${folder}/${subfolder}`);
          return;
        }
        if (!subGlFile) {
          console.log(`ℹ️ ${modelsDir}/${folder}/${subfolder} is empty`);
          return;
        }
        createFile(subGlFile, subFolderFileName, outputDir);
      });
      return;
    }

    createFile(glFile, folder, outputDir);
  });
}

function createFile(glFile, folder, outputDir) {
  console.log(`🔄 ${glFile} is being converted`);

  const outputFile = path.join(outputDir, `${folder}.tsx`);
  execSync(`npx gltfjsx "${glFile}" --types --output "${outputFile}"`);

  let content = fs.readFileSync(outputFile, "utf8");
  content = content
    .replace(
      /export function Model\(/,
      `export default function Model${folder}(`
    )
    .replace(
      /import React from 'react'/,
      `import { JSX, useMemo } from 'react'`
    )
    .replace(
      "return (",
      `useMemo(() => {
        if (materials.material) {
            if (materials.material.normalMap) {
                materials.material.normalScale.set(0.5, 0.5);
            }
            materials.material.roughness = 0.5;
            materials.material.metalness = 0.8;
        }
    }, [materials]);

    return (`
    )
    .replace(/'\/scene\.gltf'/g, `'${glFile.replace(/\\/g, "/")}'`)
    .replace(/'\/scene\.glb'/g, `'${glFile.replace(/\\/g, "/")}'`);

  fs.writeFileSync(outputFile, content);
  console.log(`✔️ Successfully processed and wrote: ${outputFile}`);
}

if (require.main === module) {
  const args = getArgs();
  convertModels(args);
}

module.exports = { convertModels };
