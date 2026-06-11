import { useRef, useState } from 'react'

import './App.css'
import { hamazushi, type SushiItem } from './menu/hamazushi'
import { Badge, Button, CarouselAutoplayIndicator, Flex, Text, VStack } from '@chakra-ui/react'



function App() {
  const [menu, setMenu] = useState<SushiItem[]>(hamazushi)
  const [currentMenu, setCurrentMenu] = useState<SushiItem>({
    name: '次食べるものはこれ！！！！！！！！',
    price: 0
  })
  const [isRolling, setIsRolling] = useState<boolean>(false)

  const [history, setHistory] = useState<Record<string, number>>({})

  //ランダムを回した回数
  const countRef = useRef<number>(0);
  //ランダムに選ばれたmenuの箱
  const poolRef = useRef<SushiItem[]>([]);

  //priceによってテキストの色変える処理
  const getPriceColor = (price: number) => {
    if (price >= 319) return '#d97706'
    else if (price >= 231) return '#718096'
    else if (price >= 176) return '#e53e3e'
    else return 'black'
  }

  const rollGacha = () => {

    const remainingCount = poolRef.current.length

    if (remainingCount == 1) {
      const finalSushi = poolRef.current[0]
      setCurrentMenu(finalSushi)
      setIsRolling(false)

      //最後に残った寿司のカウントを上げる処理
      setHistory(prev => {
        const currentCount = prev[finalSushi.name] || 0;
        return {
          ...prev,
          [finalSushi.name]: currentCount + 1
        }
      })
      return
    }

    //1.残っている候補の中からランダムに一つ選ぶ
    const currentMenuIndex = Math.floor(Math.random() * remainingCount)
    setCurrentMenu(poolRef.current[currentMenuIndex])

    //2.あらたに選んだ要素を配列から削除する
    const deleteMenuIndex = Math.floor(Math.random() * remainingCount)
    poolRef.current.splice(deleteMenuIndex, 1)
    //3. 表示スピードを少しずつ遅くする
    countRef.current++
    const delay = Math.pow(1.28, countRef.current);

    window.setTimeout(rollGacha, delay);
  }

  //クリック時に動く関数
  const handleGacha = () => {
    if (isRolling) return;
    setIsRolling(true);

    //rollgacha開始時に0から始まるように設定
    countRef.current = -1

    //最初にあらかじめ30個のランダムなメニューのindexを仕込む
    const initialPool: SushiItem[] = []


    const loopCount = Math.min(30, menu.length * 3)

    for (let i = 0; i < loopCount; i++) {
      const randomIndex = (Math.floor(Math.random() * menu.length))
      initialPool.push(menu[randomIndex])
    }
    poolRef.current = initialPool

    //ランダムで表示する処理を行う関数開始
    rollGacha()
  }

  const handleDelete = () => {
    if (isRolling) return

    setMenu(prev => {
      return prev.filter(menu => menu.name !== currentMenu.name)
    }
    )
  }


  return (

    <VStack justify='center' minH='100vh' gap={8} backgroundColor='gray.200'>

      <Flex position='absolute' top='20px' right='20px'>
        <Button onClick={handleDelete}>今のメニューを除外する</Button>
      </Flex>

      <VStack h='200px' display='flex' justifyContent='center' alignItems='center' >
        <Text
          fontSize={isRolling ? '4xl' : '6xl'}
          fontWeight='bold'
          color={isRolling ? 'black' : getPriceColor(currentMenu.price)}
          textAlign='center'>
          {currentMenu.name}
        </Text>

        {!isRolling && currentMenu.price > 0 && (history[currentMenu.name] || 1) && (
          <Badge
            colorPalette='green'
            variant='surface'
            fontSize='2xl'
            px={4}
            py={4}
            borderRadius='full'
          >
            x {history[currentMenu.name]}
          </Badge>
        )}

        {!isRolling && currentMenu.price > 0 && (
          <Text fontSize="3xl"
            color={"gray.600"} mt={4}>
            税込み{currentMenu.price}円
          </Text>
        )}

      </VStack>
      <Button size='2xl' mt={10} onClick={handleGacha}>ガチャを引く</Button>
    </VStack >

  )
}

export default App
