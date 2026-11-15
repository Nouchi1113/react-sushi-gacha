import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";

// ==========================================
// 1. はま寿司のメニュー更新処理（既存のまま）
// ==========================================
async function updateHamazushiMenu() {
  try {
    console.log(
      "はま寿司の公式サイトから全メニュー（地域ラベル付き）を取得中...",
    );

    const { data } = await axios.get("https://www.hama-sushi.co.jp/menu/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const $ = cheerio.load(data);
    const sushiItems = [];

    function pushItem(name, price, genre, area) {
      if (!name || price <= 0 || name.length >= 30) return;

      const existingItem = sushiItems.find((item) => item.name === name);
      if (existingItem) {
        if (existingItem.area.includes("全国") || area === "全国") {
          existingItem.area = ["全国"];
          if (genre !== "地域限定") {
            existingItem.genre = genre;
          }
        } else {
          if (!existingItem.area.includes(area)) {
            existingItem.area.push(area);
          }
        }
      } else {
        sushiItems.push({
          name,
          price,
          genre,
          area: [area],
        });
      }
    }

    $(".men-section").each((sectionIndex, sectionEl) => {
      const titleImg = $(sectionEl).find("h2.men-title img");
      const imgAlt = titleImg.attr("alt")?.trim() || "";
      const h3Text = $(sectionEl).find("h3").text().trim();

      let genre = "その他";
      let sectionArea = "全国";

      const matchArea = h3Text.match(
        /関東|北陸|東海|関西|中国|四国|九州|東北|北海道|沖縄/,
      );

      if (titleImg.length > 0) {
        genre = imgAlt || "お寿司";
        if (genre.includes("地域限定")) {
          sectionArea = matchArea ? matchArea[0] : "地域不明";
        } else {
          sectionArea = "全国";
        }
      } else if (h3Text) {
        if (
          h3Text.includes("お持ち帰り") ||
          h3Text.includes("丼") ||
          h3Text.includes("セット")
        ) {
          genre = "お持ち帰り";
          sectionArea = matchArea ? matchArea[0] : "全国";
        } else if (matchArea) {
          genre = "地域限定";
          sectionArea = matchArea[0];
        } else {
          genre = h3Text;
          if (genre.includes("地域限定")) {
            sectionArea = "地域不明";
          } else {
            sectionArea = "全国";
          }
        }
      } else {
        return;
      }

      $(sectionEl)
        .find(".men-products-list__li")
        .each((i, el) => {
          const textBlock = $(el).find(".men-products-item__text");
          const htmlContent = textBlock.html() || "";
          const parts = htmlContent
            .split("<br>")
            .map((p) => cheerio.load(p).text().trim())
            .filter(Boolean);

          if (parts.length === 0) return;

          const baseName = parts[0];
          const isMultipleSizes = parts
            .slice(1)
            .some((line) => line.includes("：") || line.includes(":"));

          if (!isMultipleSizes) {
            const priceText = parts[parts.length - 1];
            const nameParts = parts.slice(0, parts.length - 1);
            const fullName = nameParts.join("");

            const match = priceText.match(/税込(\d+)円/);
            const price = match
              ? parseInt(match[1])
              : parseInt(priceText.replace(/[^0-9]/g, "")) || 0;

            pushItem(fullName, price, genre, sectionArea);
          } else {
            for (let j = 1; j < parts.length; j++) {
              const line = parts[j];
              const separator = line.includes("：") ? "：" : ":";

              if (!line.includes(separator)) continue;

              const [size, priceText] = line.split(separator);
              const match = priceText.match(/税込(\d+)円/);
              const price = match
                ? parseInt(match[1])
                : parseInt(priceText.replace(/[^0-9]/g, "")) || 0;
              const fullName = `${baseName}（${size.trim()}）`;

              pushItem(fullName, price, genre, sectionArea);
            }
          }
        });
    });

    if (sushiItems.length === 0) {
      console.log("⚠️ はま寿司のメニューが見つかりませんでした。");
      return;
    }

    const fileContent = `export interface SushiItem {
  name: string
  price: number
  genre: string
  area: string[]
}

export const hamazushi: SushiItem[] = ${JSON.stringify(sushiItems, null, 2)};
`;
    fs.writeFileSync("./src/menu/hamazushi.tsx", fileContent);
    console.log(
      `🎉 成功！はま寿司を全件取得しました。 (合計: ${sushiItems.length}件)`,
    );
  } catch (error) {
    console.error("はま寿司のスクレイピング失敗:", error);
  }
}

// ==========================================
// 2. スシローのメニュー更新処理（新規追加）
// ==========================================
async function updateSushiroMenu() {
  try {
    console.log("スシローの公式サイトから全メニューを取得中...");

    const { data } = await axios.get(
      "https://www.akindo-sushiro.co.jp/menu/menu_detail/?s_id=1042",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    );

    const $ = cheerio.load(data);
    const sushiItems = [];

    const categories = [];
    $(".category-tab__item").each((i, el) => {
      categories.push($(el).text().trim());
    });

    $(".swiper-container .swiper-slide").each((slideIndex, slideEl) => {
      const currentGenre = categories[slideIndex] || "その他";

      $(slideEl)
        .find(".menu-item")
        .each((i, itemEl) => {
          const name = $(itemEl).find(".menu-item__name").text().trim();
          const priceText = $(itemEl).find(".menu-item__price").text().trim();

          if (!name) return;

          const priceMatch = priceText.match(/(\d+)円/);
          const price = priceMatch ? parseInt(priceMatch[1], 10) : 0;

          if (price <= 0) return;

          const existingItem = sushiItems.find((item) => item.name === name);
          if (existingItem) {
            if (
              existingItem.genre === "フェア商品" &&
              currentGenre !== "フェア商品"
            ) {
              existingItem.genre = currentGenre;
            }
          } else {
            sushiItems.push({
              name,
              price,
              genre: currentGenre,
              area: ["全国"],
            });
          }
        });
    });

    if (sushiItems.length === 0) {
      console.log("⚠️ スシローのメニューが見つかりませんでした。");
      return;
    }

    const fileContent = `import type { SushiItem } from './hamazushi'

export const sushiro: SushiItem[] = ${JSON.stringify(sushiItems, null, 2)};
`;
    fs.writeFileSync("./src/menu/sushiro.tsx", fileContent);
    console.log(
      `🎉 成功！スシローを全件取得しました。 (合計: ${sushiItems.length}件)`,
    );
  } catch (error) {
    console.error("スシローのスクレイピング失敗:", error);
  }
}

// ==========================================
// 3. 両方を順番に実行するエントリーポイント
// ==========================================
async function updateAllMenus() {
  await updateHamazushiMenu();
  console.log("-----------------------------------");
  await updateSushiroMenu();
}

updateAllMenus();
