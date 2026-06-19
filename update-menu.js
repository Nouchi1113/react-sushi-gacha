import fs from 'fs'
import axios from 'axios'
import * as cheerio from 'cheerio'

async function updateMenu() {
    try {
        console.log('はま寿司の公式サイトから全メニュー（地域ラベル付き）を取得中...')

        const { data } = await axios.get('https://www.hama-sushi.co.jp/menu/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })
        const $ = cheerio.load(data)
        const sushiItems = []

        $('.men-section').each((sectionIndex, sectionEl) => {
            // - 通常セクションの場合：h2.men-title img の alt 属性（例: 「期間限定」「にぎり」など）
            // - 地域限定セクションの場合：h3 タグのテキスト（例: 「関東」「北陸」「東海」「関西」「中国」など）
            const imgAlt = $(sectionEl).find('h2.men-title img').attr('alt')?.trim()
            const h3Text = $(sectionEl).find('h3').text().trim()

            let genre = 'その他'
            let sectionArea = '全国' // デフォルトは全国共通

            // 💡 2. 地域の判定
            // セクション内に「関東」「北陸」などのh3タグがあるか、またはアンカーIDに "limited" が含まれる場合
            const anchorId = $(sectionEl).find('a.u-anchor').attr('id') || ''

            if (h3Text) {
                // 4文字以上の不正な合体文字列が含まれている、または地域名にマッチしない場合はセクションごとスキップ
                if (h3Text.length > 3 || !h3Text.match(/関東|北陸|東海|関西|中国|四国|九州|東北|北海道/)) {
                    return; // ← これで「全国」に化けるのを防ぎ、このセクションの処理を飛ばします
                }

                genre = '地域限定';
                sectionArea = h3Text; // 「関東」「北陸」などが綺麗に入る
            } else if (imgAlt) {
                genre = imgAlt; // 通常のジャンル（にぎり、軍艦など）
                sectionArea = '全国';
            }

            $(sectionEl).find('.men-products-list__li').each((i, el) => {
                const textBlock = $(el).find('.men-products-item__text')
                const smallBlock = $(el).find('.men-products-item__small')

                const htmlContent = textBlock.html() || ''
                const parts = htmlContent.split('<br>')

                if (parts.length >= 2) {
                    const priceText = cheerio.load(parts[parts.length - 1]).text().trim()

                    const nameParts = parts.slice(0, parts.length - 1)
                    const rawName = nameParts.join('')
                    const name = cheerio.load(rawName).text().trim()

                    const match = priceText.match(/税込(\d+)円/)
                    const price = match ? parseInt(match[1]) : (parseInt(priceText.replace(/[^0-9]/g, '')) || 0)



                    if (name && price > 0 && name.length < 30) {
                        // 💡 すでに同じ名前の商品が配列に存在するかチェック
                        const existingItem = sushiItems.find(item => item.name === name)

                        if (existingItem) {
                            // すでに存在する商品で、かつ新しいエリアであれば配列に追加（重複防止）
                            if (!existingItem.area.includes(sectionArea)) {
                                existingItem.area.push(sectionArea)
                            }
                        } else {
                            // 新しい商品なら、areaを配列（ [sectionArea] ）として新規追加
                            sushiItems.push({
                                name,
                                price,
                                genre,
                                area: [sectionArea] // 👈 初期値を配列にする
                            })
                        }
                    }
                }
            })
        })

        if (sushiItems.length === 0) {
            console.log('⚠️ メニューが見つかりませんでした。')
            return
        }

        // 💡 型定義に area: string を追加
        const fileContent = `export interface SushiItem {
  name: string
  price: number
  genre: string
  area: string[]
}

export const hamazushi: SushiItem[] = ${JSON.stringify(sushiItems, null, 2)};
`
        fs.writeFileSync('./src/menu/hamazushi.tsx', fileContent)
        console.log(`🎉 成功！地域・ジャンル付きで全件取得しました。 (合計: ${sushiItems.length}件)`)

    } catch (error) {
        console.error('スクレイピング失敗:', error)
    }
}

updateMenu()