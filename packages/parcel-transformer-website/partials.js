const Transformer = require('@parcel/plugin').Transformer;
const fs = require('fs/promises');
const path = require('path');

async function resolveIncludeDirectives(
  filePath,
  originalCode,
  projectRoot,
  logger
) {
  const regex = /\<INCLUDE src\=["']([a-zA-Z0-9\/\-_.]*)["'] ?\/\>/g;
  const resolvedCode = [];
  const dependencyPaths = [];
  
  let modified = false;
  let resolvedUpTo = 0;

  let match;
  while ((match = regex.exec(originalCode)) !== null) {
    resolvedCode.push(
      originalCode.substring(resolvedUpTo, match.index)
    );
    resolvedUpTo = regex.lastIndex;

    let includePath = path.join(path.dirname(filePath), match[1]);
    if (path.isAbsolute(match[1])) {
      includePath = path.join(projectRoot, match[1]);
    }
    dependencyPaths.push(includePath);

    const targetExists = await fs.access(includePath)
      .then(() => true)
      .catch(() => false);
    if (!targetExists) {
      logger.error({
        message: `Failed resolving ${includePath} from ${filePath}`
      });
      continue;
    }

    const includedContent = await fs.readFile(includePath, "utf-8");
    const {
      resolvedCode: includedResolvedContent,
      dependencyPaths: subDependencyPaths
    } = await resolveIncludeDirectives(
      includePath,
      includedContent,
      projectRoot,
      logger
    );
    resolvedCode.push(includedResolvedContent);
    for (let path of subDependencyPaths)
      dependencyPaths.push(path);

    modified = true;
  }

  if (modified) {
    resolvedCode.push(
      originalCode.substring(resolvedUpTo, originalCode.length)
    );
  }

  return {
    modified: modified,
    resolvedCode: modified ? resolvedCode.join("") : originalCode,
    dependencyPaths
  };
}

module.exports = new Transformer({
  async transform({ asset, options, logger }) {
    const originalCode = await asset.getCode();

    const {
      modified,
      resolvedCode,
      dependencyPaths
    } = await resolveIncludeDirectives(
      asset.filePath,
      originalCode,
      options.projectRoot,
      logger
    );

    if (modified) {
      asset.setCode(resolvedCode);
      for (let path of dependencyPaths) {
        asset.invalidateOnFileChange(path);
      }
    }

    return [asset];
  }
});