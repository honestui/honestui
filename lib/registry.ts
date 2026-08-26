import type { RegistryItem } from "shadcn/schema";
import { Project, ScriptKind } from "ts-morph";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { getRegistryLocations } from "@/lib/registry-locations";
import { Index } from "@/registry/__index__";

export function getRegistryComponent(name: string) {
  return Index[name]?.component;
}

export async function getRegistryItem(name: string) {
  if (!/^[a-z0-9-]+(?:\.(?:css|ts|tsx))?$/.test(name)) {
    return null;
  }

  const locations = getRegistryLocations();
  const fileNames = path.extname(name)
    ? [name]
    : [`${name}.tsx`, `${name}.ts`, `${name}.css`];
  const candidates = locations.flatMap((location) =>
    fileNames.map((fileName) => ({
      path: path.join(location.path, fileName),
      type: location.type,
    })),
  );
  const productCandidate = {
    path: path.join(
      process.cwd(),
      "registry",
      "default",
      "product",
      name,
      `${name}.tsx`,
    ),
    type: "registry:component" as const,
  };
  const hasProductEntry = await fs
    .access(productCandidate.path)
    .then(() => true)
    .catch(() => false);

  if (hasProductEntry) {
    candidates.unshift(productCandidate);
  }

  let registryFile: (typeof candidates)[number] | undefined;

  for (const candidate of candidates) {
    try {
      await fs.access(candidate.path);
      registryFile = candidate;
      break;
    } catch {
      // Try the next supported registry location.
    }
  }

  if (!registryFile) {
    return null;
  }

  const isAnimatedComponent = registryFile.path.includes(
    `${path.sep}registry${path.sep}default${path.sep}animated${path.sep}`,
  );
  const isShaderComponent = registryFile.path.includes(
    `${path.sep}registry${path.sep}default${path.sep}shaders${path.sep}`,
  );
  const shaderFiles = isShaderComponent
    ? await getShaderFiles(registryFile.path)
    : null;
  const productFiles = registryFile.path.includes(
    `${path.sep}registry${path.sep}default${path.sep}product${path.sep}`,
  )
    ? await getProductItemFiles(registryFile.path)
    : null;

  const typedItem = {
    name,
    type: registryFile.type,
    files:
      shaderFiles ??
      productFiles ?? [
        {
          path: registryFile.path,
          type: registryFile.type,
          ...(isAnimatedComponent && {
            target: `components/animated/${path.basename(registryFile.path)}`,
          }),
        },
      ],
  } as RegistryItem;

  const files = typedItem.files || [];

  // Read every file concurrently, the reads are independent of each other.
  const processedFiles = await Promise.all(
    files.map(async (file) => {
      const content = await getFileContent(file);
      const relativePath = path.relative(process.cwd(), file.path);

      return {
        ...file,
        content,
        path: relativePath,
      };
    }),
  );

  // Fix file paths.
  const finalFiles = fixFilePaths(processedFiles);
  const source = processedFiles.map((file) => file.content ?? "").join("\n");
  const { dependencies, registryDependencies } = getDependencies(source);
  const bundledNames = new Set(
    processedFiles.flatMap((file) => [
      path.basename(file.path),
      path.basename(file.path, path.extname(file.path)),
    ]),
  );
  const externalRegistryDependencies = registryDependencies.filter(
    (dependency) => !bundledNames.has(dependency),
  );

  return {
    ...typedItem,
    ...(dependencies.length > 0 && { dependencies }),
    ...(externalRegistryDependencies.length > 0 && {
      registryDependencies: externalRegistryDependencies,
    }),
    files: finalFiles,
  };
}

async function getProductItemFiles(registryFilePath: string) {
  const itemName = path.basename(path.dirname(registryFilePath));
  const directory = path.dirname(registryFilePath);

  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  // Keep the entry file first so docs render the main component source.
  const entryFileName = `${itemName}.tsx`;
  if (files.includes(entryFileName)) {
    files.splice(files.indexOf(entryFileName), 1);
    files.unshift(entryFileName);
  }

  return files.map((fileName) => ({
    path: path.join(directory, fileName),
    type: "registry:component" as const,
    target: `components/ui/${itemName}/${fileName}`,
  }));
}

async function getShaderFiles(registryFilePath: string) {
  const itemName = path.basename(
    registryFilePath,
    path.extname(registryFilePath),
  );
  const componentFile = {
    path: registryFilePath,
    type: "registry:component" as const,
    target: `components/shaders/${path.basename(registryFilePath)}`,
  };
  const cssPath = path.join(
    path.dirname(registryFilePath),
    "css",
    `${itemName}.css`,
  );

  try {
    await fs.access(cssPath);
  } catch {
    return [componentFile];
  }

  return [
    componentFile,
    {
      path: cssPath,
      type: "registry:component" as const,
      target: `components/shaders/css/${itemName}.css`,
    },
  ];
}

function getDependencies(source: string) {
  const dependencies = new Set<string>();
  const registryDependencies = new Set<string>();
  const imports = source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g);

  for (const match of imports) {
    const specifier = match[1];

    if (
      specifier.startsWith("@/registry/default/ui/") ||
      specifier.startsWith("@/registry/default/animated/") ||
      specifier.startsWith("@/components/ui/") ||
      specifier.startsWith("@/components/") ||
      (specifier.startsWith("@/lib/") && specifier !== "@/lib/utils") ||
      specifier.startsWith("@/hooks/")
    ) {
      registryDependencies.add(path.basename(specifier));
      continue;
    }

    if (specifier.startsWith(".")) {
      registryDependencies.add(path.basename(specifier));
      continue;
    }

    if (
      specifier.startsWith("@/") ||
      specifier === "react" ||
      specifier.startsWith("react/") ||
      specifier === "next" ||
      specifier.startsWith("next/")
    ) {
      continue;
    }

    dependencies.add(getPackageName(specifier));
  }

  return {
    dependencies: Array.from(dependencies).sort(),
    registryDependencies: Array.from(registryDependencies).sort(),
  };
}

function getPackageName(specifier: string) {
  if (specifier.startsWith("@")) {
    return specifier.split("/").slice(0, 2).join("/");
  }

  return specifier.split("/")[0];
}

async function getFileContent(file: { path: string; type?: string }) {
  // Resolve TypeScript path aliases (@/) to actual filesystem paths
  const resolvedPath = file.path.replace(/^@\//, path.join(process.cwd(), "src") + "/");
  const raw = await fs.readFile(resolvedPath, "utf-8");

  if (path.extname(file.path) === ".css") {
    return raw;
  }

  const project = new Project({
    compilerOptions: {},
  });

  const tempFile = await createTempSourceFile(file.path);
  const sourceFile = project.createSourceFile(tempFile, raw, {
    scriptKind: ScriptKind.TSX,
  });

  // Remove meta variables.
  // removeVariable(sourceFile, "iframeHeight")
  // removeVariable(sourceFile, "containerClassName")
  // removeVariable(sourceFile, "description")

  let code = sourceFile.getFullText();

  // Some registry items uses default export.
  // We want to use named export instead.
  // TODO: do we really need this? - @shadcn.
  // if (file.type !== "registry:page") {
  //   code = code.replaceAll("export default", "export")
  // }

  // Fix imports.
  code = fixImport(code);

  return code;
}

function getFileTarget(file: { path: string; type?: string; target?: string }) {
  let target = file.target;

  if (!target || target === "") {
    const fileName = file.path.split("/").pop();
    if (
      file.type === "registry:block" ||
      file.type === "registry:component" ||
      file.type === "registry:example"
    ) {
      target = `components/${fileName}`;
    }

    if (file.type === "registry:ui") {
      target = `components/ui/${fileName}`;
    }

    if (file.type === "registry:hook") {
      target = `hooks/${fileName}`;
    }

    if (file.type === "registry:lib") {
      target = `lib/${fileName}`;
    }
  }

  return target ?? "";
}

async function createTempSourceFile(filename: string) {
  const dir = await fs.mkdtemp(path.join(tmpdir(), "shadcn-"));
  return path.join(dir, filename);
}

function fixFilePaths(
  files: Array<{
    path: string;
    type?: string;
    target?: string;
    content?: string;
  }>,
) {
  if (!files) {
    return [];
  }

  // Resolve all paths relative to the first file's directory.
  const firstFilePath = files[0]?.path;
  if (!firstFilePath) {
    return [];
  }
  const firstFilePathDir = path.dirname(firstFilePath);

  return files.map((file) => {
    return {
      ...file,
      path: path.relative(firstFilePathDir, file.path),
      target: getFileTarget(file),
    };
  });
}

export function fixImport(content: string) {
  const regex =
    /@\/(.+?)\/((?:.*?\/)?(?:components|ui|hooks|lib|charts|animated|shaders))\/([\w-]+)/g;

  const replacement = (match: string, _path: string, type: string, component: string) => {
    if (type.endsWith("components")) {
      return `@/components/${component}`;
    }
    if (type.endsWith("ui")) {
      return `@/components/ui/${component}`;
    }
    if (type.endsWith("hooks")) {
      return `@/hooks/${component}`;
    }
    if (type.endsWith("lib")) {
      return `@/lib/${component}`;
    }
    if (type.endsWith("charts")) {
      return "honestui/charts";
    }
    if (type.endsWith("animated")) {
      return `@/components/animated/${component}`;
    }
    if (type.endsWith("shaders")) {
      return `@/components/shaders/${component}`;
    }

    return match;
  };

  return content
    .replace(regex, replacement)
    .replaceAll("@/lib/hooks/", "@/hooks/")
    // Product items install into `components/ui/<item>/`, so their imports are
    // rewritten after the general alias pass (which does not handle nested dirs).
    .replaceAll("@/registry/default/product/", "@/components/ui/");
}

type FileTree = {
  name: string;
  path?: string;
  children?: FileTree[];
};

export function createFileTreeForRegistryItemFiles(
  files: Array<{ path: string; target?: string }>,
) {
  const root: FileTree[] = [];

  for (const file of files) {
    const path = file.target ?? file.path;
    const parts = path.split("/");
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existingNode = currentLevel.find((node) => node.name === part);

      if (existingNode) {
        if (isFile) {
          // Update existing file node with full path
          existingNode.path = path;
        } else if (existingNode.children) {
          // Move to next level in the tree
          currentLevel = existingNode.children;
        }
      } else if (part) {
        const newNode: FileTree = isFile ? { name: part, path } : { children: [], name: part };

        currentLevel.push(newNode);

        if (!isFile && newNode.children) {
          currentLevel = newNode.children;
        }
      }
    }
  }

  return root;
}
