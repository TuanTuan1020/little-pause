# 放空一下 · 烦恼回收站

一个点击或划动捏泡泡的静态解压小游戏

## 功能

- 点按或划动捏泡泡，弹性消除、光圈与碎屑反馈
- 青柠、蜜桃、海盐三种配色
- 写下烦恼并放进泡泡；内容不会上传
- 一把扫走、重新生成；声音默认关闭，可手动开启
- 适配手机与桌面，尊重系统减少动态效果设置

## 本地运行

直接打开 index.html，或在当前目录运行 `python3 -m http.server 8000`

## GitHub Pages

在仓库 Settings → Pages 选择 Deploy from a branch，分支 main，目录 / (root)，点击 Save

## 回归检查

安装 Node.js 后运行：

```sh
node tests/audio.cjs
node tests/first-tap.cjs
```

声音需要用户手势激活；移动 Safari 实际声音输出仍受设备和浏览器设置影响
