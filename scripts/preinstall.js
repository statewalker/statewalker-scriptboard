import fs from "fs";
import path from "path";
import url from "url";
import child_process from "child_process";
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

Promise.resolve().then(main).catch(console.error);

async function main() {
  const rootDir = path.resolve(__dirname, "../");
  const metaPath = path.resolve(rootDir, "package.json");
  const str = await fs.promises.readFile(metaPath, "UTF-8");
  const meta = JSON.parse(str);
  const packages = meta.packages || {};
  for (let [dir, uri] of Object.entries(packages)) {
    dir = path.resolve(rootDir, dir);
    if (!fs.existsSync(dir)) {
      const [repositoryUri, branch] = uri.split("#");
      await clone(dir, repositoryUri, branch);
    }
  }
}

async function clone(dir, uri, branch) {
  const baseDir = path.dirname(dir);
  await fs.promises.mkdir(baseDir, { recursive: true });
  let i = 1;
  const args = branch
    ? ["clone", "--branch", branch, uri, dir]
    : ["clone", uri, dir];
  for await (let msg of spawn("git", args)) {
    console.log(i++, "\t", msg);
  }
}

async function* spawn(command, args = [], options = {}) {
  const p = child_process.spawn(command, args, options);
  try {
    const promise = new Promise((resolve, reject) => {
      p.on("close", resolve);
      p.on("error", reject);
    });
    const decoder = new TextDecoder();
    let prev = "";
    for await (const block of p.stderr) {
      const str = decoder.decode(block);
      prev += str;
      const array = prev.split("\n");
      prev = array.pop();
      yield* array;
    }
    if (prev) yield prev;
    await promise;
    yield "Done.";
  } catch (error) {
    yield error.message;
  }
}
