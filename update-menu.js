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

        // 重複チェックをしつつ配列に格納する共通ヘルパー関数
        function pushItem(name, price, genre, area) {
            if (!name || price <= 0 || name.length >= 30) return;

            const existingItem = sushiItems.find(item => item.name === name)
            if (existingItem) {
                if (!existingItem.area.includes(area)) {
                    existingItem.area.push(area)
                }
            } else {
                sushiItems.push({
                    name,
                    price,
                    genre,
                    area: [area]
                })
            }
        }

        $('.men-section').each((sectionIndex, sectionEl) => {
            const imgAlt = $(sectionEl).find('h2.men-title img').attr('alt')?.trim()
            const h3Text = $(sectionEl).find('h3').text().trim()

            let genre = 'その他'
            let sectionArea = '全国'

            if (h3Text) {
                if (h3Text.length > 3 || !h3Text.match(/関東|北陸|東海|関西|中国|四国|九州|東北|北海道/)) {
                    return;
                }
                genre = '地域限定';
                sectionArea = h3Text;
            } else if (imgAlt) {
                genre = imgAlt;
                sectionArea = '全国';
            }

            $(sectionEl).find('.men-products-list__li').each((i, el) => {
                const textBlock = $(el).find('.men-products-item__text')
                const htmlContent = textBlock.html() || ''

                // 💡 <br>で分解し、それぞれの行をクレンジング（文字前後の空白除去）して配列化
                const parts = htmlContent.split('<br>').map(p => cheerio.load(p).text().trim()).filter(Boolean)

                if (parts.length === 0) return

                // 1行目は絶対にベースの商品名（例：「Qoo オレンジ」や「まぐろ」）
                const baseName = parts[0]

                // 💡 判定分岐：2行目が「価格（通常）」か「サイズ：価格（ドリンク等）」か
                const secondLine = parts[1] || ''
                const hasSeparator = secondLine.includes('：') || secondLine.includes(':')

                if (parts.length === 2 && !hasSeparator) {
                    // ⭕【通常パターン】お寿司やサイドメニュー（1行目が名前、2行目が価格）
                    const priceText = secondLine
                    const match = priceText.match(/税込(\d+)円/)
                    const price = match ? parseInt(match[1]) : (parseInt(priceText.replace(/[^0-9]/g, '')) || 0)

                    pushItem(baseName, price, genre, sectionArea)

                } else {
                    // ⭕【ドリンクなどの複数サイズパターン】
                    // 2行目以降（S：180円… M：230円… など）をループでそれぞれ1商品として処理
                    for (let j = 1; j < parts.length; j++) {
                        const line = parts[j]
                        const separator = line.includes('：') ? '：' : ':'

                        if (!line.includes(separator)) continue

                        const [size, priceText] = line.split(separator)

                        // 価格の抽出
                        const match = priceText.match(/税込(\d+)円/)
                        const price = match ? parseInt(match[1]) : (parseInt(priceText.replace(/[^0-9]/g, '')) || 0)

                        // 商品名を「Qoo オレンジ（S）」のように合体させる
                        const fullName = `${baseName}（${size.trim()}）`

                        pushItem(fullName, price, genre, sectionArea)
                    }
                }
            })
        })

        if (sushiItems.length === 0) {
            console.log('⚠️ メニューが見つかりませんでした。')
            return
        }

        const fileContent = `export interface SushiItem {
  name: string
  price: number
  genre: string
  area: string[]
}

export const hamazushi: SushiItem[] = ${JSON.stringify(sushiItems, null, 2)};
`
        fs.writeFileSync('./src/menu/hamazushi.tsx', fileContent)
        console.log(`🎉 成功！地域・ジャンル・複数サイズ対応付きで全件取得しました。 (合計: ${sushiItems.length}件)`)

    } catch (error) {
        console.error('スクレイピング失敗:', error)
    }
}

updateMenu()