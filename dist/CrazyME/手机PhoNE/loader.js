// ==== 手机PhoNE 自动更新加载器（整段贴进酒馆助手脚本库，以后不用再改）====
// 每次刷新先问「最新是哪个 tag」，再 import 那个不可变地址：
// tag 地址的缓存头是 immutable，换 tag 就是换 URL，所以永远吃不到旧版本。
const REPO = 'MIchelia344/SillyTavern_Product';
const CDN = 'https://testingcf.jsdelivr.net/gh/' + REPO;
const FILE = 'dist/CrazyME/手机PhoNE/index.js';
const FALLBACK = 'v20261108-0033';

async function tagFromManifest() {
  try {
    const res = await fetch(`${CDN}@main/latest.json`, { cache: 'no-store' });
    if (res.ok) {
      const info = await res.json();
      if (info && info.version) return String(info.version);
    }
  } catch (error) {
    console.warn('[手机PhoNE] 读 latest.json 失败', error);
  }
  return '';
}

async function tagFromGitHub() {
  try {
    // GitHub API 不进 CDN 缓存，永远是最新的；未登录限 60 次/小时
    const res = await fetch(`https://api.github.com/repos/${REPO}/tags`, { cache: 'no-store' });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list[0] && list[0].name) return String(list[0].name);
    }
  } catch (error) {
    console.warn('[手机PhoNE] 读 GitHub tags 失败', error);
  }
  return '';
}

// 两个来源可能一个新一个旧（CDN 的 latest.json 有 12 小时边缘缓存），
// tag 名是 v年月日-时分，按字符串大小比就能取到真正最新的那个
const candidates = [await tagFromManifest(), await tagFromGitHub()].filter(Boolean).sort();
const tag = candidates.length ? candidates[candidates.length - 1] : FALLBACK;

console.info('[手机PhoNE] 加载版本', tag);
try {
  await import(`${CDN}@${tag}/${FILE}`);
} catch (error) {
  console.warn('[手机PhoNE] 该版本加载失败，退回内置版本', error);
  await import(`${CDN}@${FALLBACK}/${FILE}`);
}
