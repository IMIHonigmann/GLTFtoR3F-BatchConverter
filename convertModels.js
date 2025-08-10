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
    const gltf = path.join(modelsDir, folder, "scene.gltf");
    if (fs.existsSync(`${outputDir}/${folder}.tsx`)) {
      console.log(`🚫 Skipped ${modelsDir}/${folder}`);
      return;
    }
    if (!fs.existsSync(gltf)) {
      fs.readdirSync(`${modelsDir}/${folder}`).forEach((subfolder) => {
        const subGltf = path.join(modelsDir, folder, subfolder, "scene.gltf");
        const subFolderFileName = `${subfolder}-${folder}`;
        if (fs.existsSync(`${outputDir}/${subFolderFileName}.tsx`)) {
          console.log(`🚫 Skipped ${modelsDir}/${folder}/${subfolder}`);
          return;
        }
        if (!fs.existsSync(subGltf)) return;
        createFile(subGltf, subFolderFileName, outputDir);
      });
      return;
    }

    createFile(gltf, folder, outputDir);
  });
}

function createFile(gltf, folder, outputDir) {
  console.log(`🔄 ${gltf} is being converted`);

  const outputFile = path.join(outputDir, `${folder}.tsx`);
  execSync(`npx gltfjsx "${gltf}" --types --output "${outputFile}"`);

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
    .replace(/'\/scene\.gltf'/g, `'${gltf.replace(/\\/g, "/")}'`);

  fs.writeFileSync(outputFile, content);
  console.log(`✔️ Successfully processed and wrote: ${outputFile}`);
}

if (require.main === module) {
  const args = getArgs();
  convertModels(args);
}

module.exports = { convertModels };
