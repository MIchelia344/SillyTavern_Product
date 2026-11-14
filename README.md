# 构建产物（自动发布）

这个仓库只放打包好的文件，供酒馆助手（Tavern Helper）脚本直接 import。
源码不在仓库里，请回主仓库修改。

最新版本：`v20261114-1555`（见 [`latest.json`](./latest.json)）

## 用法一：固定版本（不会自动更新）

### dist/CrazyME/手机PhoNE/index.js

```js
import 'https://testingcf.jsdelivr.net/gh/MIchelia344/SillyTavern_Product@v20261114-1555/dist/CrazyME/手机PhoNE/index.js'
```

## 用法二：自动更新加载器（推荐，贴一次以后不用改）

下面是本版生成的加载器全文，粘进酒馆助手脚本库即可；
它每次刷新先读 `latest.json` 拿到最新 tag，再 import 那个不可变地址，
所以既不会吃到旧缓存，也不用在更新时改脚本。

### dist/CrazyME/手机PhoNE/index.js

```js
// ==== 手机PhoNE 自动更新加载器（整段贴进酒馆助手脚本库，以后不用再改）====
// 每次刷新先问「最新是哪个 tag」，再 import 那个不可变地址：
// tag 地址的缓存头是 immutable，换 tag 就是换 URL，所以永远吃不到旧版本。
// 注意：酒馆助手的脚本是普通脚本，不能写顶层 await，所以整体包在 async IIFE 里。
(async () => {
const REPO = 'MIchelia344/SillyTavern_Product';
const BRANCH = 'main';
const FILE = 'dist/CrazyME/手机PhoNE/index.js';
const FALLBACK = 'v20261114-1555';
const TIMEOUT_MS = 3500;
// jsdelivr 和国内常见的同构镜像，按顺序试；前面几个在国内可能超时，由后面兜底。
const MIRRORS = [
  'https://testingcf.jsdelivr.net/gh/',
  'https://fastly.jsdelivr.net/gh/',
  'https://gcore.jsdelivr.net/gh/',
  'https://cdn.jsdelivr.net/gh/',
  'https://jsd.onmicrosoft.cn/gh/',
  'https://jsdelivr.b-cdn.net/gh/',
].filter((value, index, all) => all.indexOf(value) === index);

function fileUrl(base, tag) {
  return `${base}${REPO}@${tag}/${FILE}`;
}

// 网络不通时必须能自己超时：GitHub API 在某些网络环境下会一直挂着，
// 没有超时就会卡在这里，永远走不到下面的 import。
async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
  return res.ok ? res.json() : null;
}

// 多镜像并行问 latest.json，全部失败最多拖 TIMEOUT_MS，不会把加载卡死。
async function tagsFromMirrors() {
  const urls = MIRRORS.map(base => `${base}${REPO}@${BRANCH}/latest.json`);
  const results = await Promise.allSettled(
    urls.map(async url => {
      const info = await fetchJson(url);
      return info && info.version ? String(info.version) : '';
    }),
  );
  return results.filter(result => result.status === 'fulfilled' && result.value).map(result => result.value);
}

async function tagFromGitHub() {
  try {
    // GitHub API 不进 CDN 缓存，永远是最新的；未登录限 60 次/小时
    const list = await fetchJson(`https://api.github.com/repos/${REPO}/tags`);
    if (Array.isArray(list) && list[0] && list[0].name) return String(list[0].name);
  } catch (error) {
    console.warn('[手机PhoNE] 读 GitHub tags 失败', error);
  }
  return '';
}

// 镜像的 latest.json 可能有 12 小时边缘缓存，GitHub API 最新但常被墙；
// tag 名是 v年月日-时分，按字符串大小比就能取到真正最新的那个
const manifestTags = await tagsFromMirrors();
const githubTag = await tagFromGitHub();
const candidates = [...manifestTags, githubTag].filter(Boolean).sort();
const tag = candidates.length ? candidates[candidates.length - 1] : FALLBACK;

// 逐个镜像试 import，第一个成功的就用它；全部失败再换内置版本重试一轮。
async function importFromMirrors(tagToLoad) {
  for (const base of MIRRORS) {
    try {
      await import(fileUrl(base, tagToLoad));
      return base;
    } catch (error) {
      console.warn('[手机PhoNE] 镜像不可用', base, error);
    }
  }
  return '';
}

console.info('[手机PhoNE] 加载版本', tag);
let usedMirror = await importFromMirrors(tag);
if (!usedMirror && tag !== FALLBACK) {
  console.warn('[手机PhoNE] 最新版本在所有镜像都失败，退回内置版本', FALLBACK);
  usedMirror = await importFromMirrors(FALLBACK);
}
if (usedMirror) console.info('[手机PhoNE] 已从镜像加载', usedMirror);
else console.warn('[手机PhoNE] 所有镜像都加载失败，请检查网络或换镜像');
})();
```

## 缓存说明（实测）

- `@main`：`max-age=604800`（浏览器 7 天）、`s-maxage=43200`（CDN 12 小时）
- `@<tag>`：`max-age=31536000, immutable`（一年，且永不变）

所以「自动更新」不能靠 `@main`，要靠「每次取到新 tag 再 import」。
