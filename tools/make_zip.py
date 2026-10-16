#!/usr/bin/env python3
"""打包 Chrome 应用商店上传包。
只收录扩展运行必需文件：manifest.json + content.js + icons/*.png。
排除 tools/、dist/、.git、README 等非运行文件，避免触发商店"可疑文件"审查。
用法: python tools/make_zip.py
输出: dist/goofish-space-next-<version>.zip
"""
import json
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "manifest.json")
INCLUDE = ["manifest.json", "content.js", "icons"]


def main():
    with open(MANIFEST, "r", encoding="utf-8") as f:
        version = json.load(f)["version"]

    os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
    out = os.path.join(ROOT, "dist", f"goofish-space-next-{version}.zip")

    count = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for entry in INCLUDE:
            p = os.path.join(ROOT, entry)
            if os.path.isdir(p):
                for dirpath, _dirs, files in os.walk(p):
                    for name in files:
                        if name.startswith("promo_"):   # 商店素材，非扩展运行文件
                            continue
                        fp = os.path.join(dirpath, name)
                        z.write(fp, os.path.relpath(fp, ROOT).replace("\\", "/"))
                        count += 1
            else:
                z.write(p, entry)
                count += 1

    print(f"packed {count} files -> {out}")
    print(f"size: {os.path.getsize(out)} bytes")


if __name__ == "__main__":
    main()
