import { useRef, useState } from 'react'

import './App.css'
import { hamazushi, type SushiItem } from './menu/hamazushi'
import { Button, Text, VStack } from '@chakra-ui/react'



function App() {
  const [menu, setMenu] = useState<SushiItem[]>(hamazushi)
  const [currentMenu, setCurrentMenu] = useState<SushiItem>({
    name: '次食べるものはこれ！！！！！！！！',
    price: 0
  })
  const [isRolling, setIsRolling] = useState<boolean>(false)

  //ランダムを回した回数
  const countRef = useRef<number>(0);
  //ランダムに選ばれたmenuの箱
  const poolRef = useRef<SushiItem[]>([]);


  const rollGacha = () => {

    const remainingCount = poolRef.current.length

    if (remainingCount == 1) {
      setCurrentMenu(poolRef.current[0])
      setIsRolling(false)
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
    for (let i = 0; i < 30; i++) {
      const randomIndex = (Math.floor(Math.random() * menu.length))
      initialPool.push(menu[randomIndex])
    }
    poolRef.current = initialPool

    //関数開始
    rollGacha()
  }


  return (

    <VStack justify='center' minH='100vh' gap={10} backgroundColor='gray.200'>
      <VStack h='300px' display='flex' justifyContent='center' alignItems='center' >
        <Text
          fontSize={isRolling ? '4xl' : '6xl'}
          fontWeight='bold'
          color={isRolling ? 'black' : 'red'}
          textAlign='center'>
          {currentMenu.name}
        </Text>

        {!isRolling && currentMenu.price > 0 && (
          <Text fontSize="3xl" color="gray.600" mt={4}>
            税込み{currentMenu.price}円
          </Text>
        )}

      </VStack>
      <Button size='2xl' mt={10} onClick={handleGacha}>ガチャを引く</Button>
    </VStack >

  )
}

export default App
