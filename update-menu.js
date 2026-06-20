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
                // 💡 既存のエリア、または新しいエリアのどちらかが「全国」の場合
                if (existingItem.area.includes('全国') || area === '全国') {
                    existingItem.area = ['全国'];
                    // ジャンルは「地域限定」より、本来の具体的なジャンル（にぎり等）を優先したいので、
                    // 新しいジャンルが「地域限定」以外の場合のみ上書きする
                    if (genre !== '地域限定') {
                        existingItem.genre = genre;
                    }
                } else {
                    // 💡 どちらも「全国」ではない場合（純粋な地域限定の重複：東海、関西、沖縄など）
                    if (!existingItem.area.includes(area)) {
                        existingItem.area.push(area);
                    }
                }
            } else {
                // 新規登録
                sushiItems.push({
                    name,
                    price,
                    genre,
                    area: [area]
                })
            }
        }

        $('.men-section').each((sectionIndex, sectionEl) => {
            const titleImg = $(sectionEl).find('h2.men-title img')
            const imgAlt = titleImg.attr('alt')?.trim() || ''
            const h3Text = $(sectionEl).find('h3').text().trim()

            let genre = 'その他'
            let sectionArea = '全国'

            // 💡 1. 沖縄を追加
            const matchArea = h3Text.match(/関東|北陸|東海|関西|中国|四国|九州|東北|北海道|沖縄/)

            if (titleImg.length > 0) {
                genre = imgAlt || 'お寿司';
                // 💡 2. もし見出し画像が「地域限定」等だった場合、勝手に「全国」扱いにしない
                if (genre.includes('地域限定')) {
                    sectionArea = matchArea ? matchArea[0] : '地域不明';
                } else {
                    sectionArea = '全国';
                }

            } else if (h3Text) {
                if (h3Text.includes('お持ち帰り') || h3Text.includes('丼') || h3Text.includes('セット')) {
                    genre = 'お持ち帰り';
                    sectionArea = matchArea ? matchArea[0] : '全国';
                } else if (matchArea) {
                    genre = '地域限定';
                    sectionArea = matchArea[0];
                } else {
                    genre = h3Text;
                    // 💡 3. テキストが単に「地域限定」等で地域名がない場合も「全国」を避ける
                    if (genre.includes('地域限定')) {
                        sectionArea = '地域不明';
                    } else {
                        sectionArea = '全国';
                    }
                }
            } else {
                return;
            }

            // 商品のループ処理
            $(sectionEl).find('.men-products-list__li').each((i, el) => {
                const textBlock = $(el).find('.men-products-item__text')
                const htmlContent = textBlock.html() || ''

                // <br>で分解し、それぞれの行をクレンジングして配列化
                const parts = htmlContent.split('<br>').map(p => cheerio.load(p).text().trim()).filter(Boolean)

                if (parts.length === 0) return

                const baseName = parts[0]
                const isMultipleSizes = parts.slice(1).some(line => line.includes('：') || line.includes(':'))

                if (!isMultipleSizes) {
                    // ⭕【通常パターン】お寿司やサイドメニュー
                    const priceText = parts[parts.length - 1]
                    const nameParts = parts.slice(0, parts.length - 1)
                    const fullName = nameParts.join('')

                    const match = priceText.match(/税込(\d+)円/)
                    const price = match ? parseInt(match[1]) : (parseInt(priceText.replace(/[^0-9]/g, '')) || 0)

                    pushItem(fullName, price, genre, sectionArea)

                } else {
                    // ⭕【ドリンクなどの複数サイズパターン】
                    for (let j = 1; j < parts.length; j++) {
                        const line = parts[j]
                        const separator = line.includes('：') ? '：' : ':'

                        if (!line.includes(separator)) continue

                        const [size, priceText] = line.split(separator)

                        const match = priceText.match(/税込(\d+)円/)
                        const price = match ? parseInt(match[1]) : (parseInt(priceText.replace(/[^0-9]/g, '')) || 0)
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