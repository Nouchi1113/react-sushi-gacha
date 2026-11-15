import { useRef, useState } from "react";

import "./App.css";
import { hamazushi, type SushiItem } from "./menu/hamazushi";
import { sushiro } from "./menu/sushiro";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import ModalMenuList from "./components/ModalMenuList";
import { getPriceColor } from "./utils/price";
import ModalHisotry from "./components/ModalHistory";
import ModalExceptMenuList from "./components/ModalExceptMenuList";
import { Trash2, XCircle } from "lucide-react";
import { Toaster, toaster } from "./components/ui/toaster";

type StoreType = "hamazushi" | "sushiro";

// 各店舗の「候補メニュー」と「初期除外メニュー」を振り分けるヘルパー
const getStoreMenuData = (
  store: StoreType,
): { activeMenus: SushiItem[]; initialExceptMenus: SushiItem[] } => {
  if (store === "hamazushi") {
    const activeMenus = hamazushi.filter(
      (menu) =>
        (menu.area.includes("全国") || menu.area.includes("関東")) &&
        menu.genre !== "都市型" &&
        menu.genre !== "アルコール",
    );
    return {
      activeMenus,
      initialExceptMenus: [], // はま寿司の初期除外リストが空の場合
    };
  } else {
    // スシローの全データに area を補完
    const allSushiro: SushiItem[] = sushiro.map((menu) => ({
      ...menu,
      area: ["全国"],
    }));

    // 初期状態で除外したいジャンル
    const excludeGenres = ["ドリンク", "ランチ", "お持ち帰りメニュー"];

    return {
      activeMenus: allSushiro.filter(
        (menu) => !excludeGenres.includes(menu.genre),
      ),
      initialExceptMenus: allSushiro.filter((menu) =>
        excludeGenres.includes(menu.genre),
      ),
    };
  }
};

const INITIAL_CURRENT_MENU: SushiItem = {
  name: "次食べるものはこれ！！！！！！！！",
  price: 0,
  genre: "",
  area: [""],
};

function App() {
  const [selectedStore, setSelectedStore] = useState<StoreType>("hamazushi");

  // 初期データを取得
  const initialData = getStoreMenuData("hamazushi");
  const [menus, setMenus] = useState<SushiItem[]>(initialData.activeMenus);
  const [exceptMenus, setExceptMenus] = useState<SushiItem[]>(
    initialData.initialExceptMenus,
  );

  const [currentMenu, setCurrentMenu] =
    useState<SushiItem>(INITIAL_CURRENT_MENU);
  const [history, setHistory] = useState<SushiItem[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [sushiCounts, setSushiCounts] = useState<Record<string, number>>({});

  const [isListOpen, setIsListOpen] = useState(false);
  const [isExceptListOpen, setIsExceptListOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const countRef = useRef<number>(0);
  const poolRef = useRef<SushiItem[]>([]);

  // 店舗切り替えハンドラ
  const handleSelectStore = (store: StoreType) => {
    if (isRolling || selectedStore === store) return;

    const nextData = getStoreMenuData(store);
    setSelectedStore(store);
    setMenus(nextData.activeMenus);
    setExceptMenus(nextData.initialExceptMenus); // 👈 スシローに切り替えた瞬間、ドリンクとお持ち帰りが除外一覧に入る
    setCurrentMenu(INITIAL_CURRENT_MENU);
    setHistory([]);
    setSushiCounts({});
  };

  const rollGacha = () => {
    const remainingCount = poolRef.current.length;

    if (remainingCount == 1) {
      const finalSushi = poolRef.current[0];
      setCurrentMenu(finalSushi);
      setIsRolling(false);

      // 最後に残った寿司のカウントを上げる処理
      setSushiCounts((prev) => {
        const currentCount = prev[finalSushi.name] || 0;
        return {
          ...prev,
          [finalSushi.name]: currentCount + 1,
        };
      });

      setHistory((prev) => [...prev, finalSushi]);
      return;
    }

    // 1. 残っている候補の中からランダムに一つ選ぶ
    const currentMenuIndex = Math.floor(Math.random() * remainingCount);
    setCurrentMenu(poolRef.current[currentMenuIndex]);

    // 2. あらたに選んだ要素を配列から削除する
    const deleteMenuIndex = Math.floor(Math.random() * remainingCount);
    poolRef.current.splice(deleteMenuIndex, 1);

    // 3. 表示スピードを少しずつ遅くする
    countRef.current++;
    const delay = Math.pow(1.28, countRef.current);

    window.setTimeout(rollGacha, delay);
  };

  // クリック時に動く関数
  const handleGacha = () => {
    if (isRolling) return;
    if (menus.length === 0) return;
    setIsRolling(true);

    // rollgacha開始時に0から始まるように設定
    countRef.current = -1;

    // 最初にあらかじめ30個のランダムなメニューのindexを仕込む
    const initialPool: SushiItem[] = [];
    const loopCount = Math.min(30, menus.length * 3);

    for (let i = 0; i < loopCount; i++) {
      const randomIndex = Math.floor(Math.random() * menus.length);
      initialPool.push(menus[randomIndex]);
    }
    poolRef.current = initialPool;

    // ランダムで表示する処理を行う関数開始
    rollGacha();
  };

  const handleDelete = () => {
    if (isRolling) return;
    if (currentMenu.price === 0) return;

    const isStillInMenu = menus.some((menu) => menu.name === currentMenu.name);
    if (!isStillInMenu) return;

    toaster.create({
      title: "ゴミ箱に入れました",
      description: `${currentMenu.name} をゴミ箱に入れました`,
      type: "info",
      duration: 1500,
    });

    setExceptMenus((prev) => [...prev, currentMenu]);
    setHistory((prev) => prev.filter((menu) => menu.name !== currentMenu.name));
    setMenus((prev) => prev.filter((menu) => menu.name !== currentMenu.name));
  };

  return (
    <VStack justify="center" minH="100vh" gap={8} backgroundColor="#e6edf5">
      {isListOpen && (
        <ModalMenuList
          menus={menus}
          sushiCounts={sushiCounts}
          onClose={() => setIsListOpen(false)}
        />
      )}

      {isExceptListOpen && (
        <ModalExceptMenuList
          exceptMenus={exceptMenus}
          onClose={() => setIsExceptListOpen(false)}
        />
      )}

      {isHistoryOpen && (
        <ModalHisotry
          history={history}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}

      <Flex
        w="100%"
        justifyContent="space-between"
        alignItems="center"
        pt={2}
        px={2}
        flexWrap="wrap"
        gap={2}
      >
        <Flex gap={3}>
          <Button onClick={() => setIsListOpen(true)}>🍣お品書き</Button>
          <Button onClick={() => setIsExceptListOpen(true)}>
            <Trash2 size={16} />
            除外一覧
          </Button>
          <Button onClick={() => setIsHistoryOpen(true)}>🍵履歴</Button>
        </Flex>

        {/* 店舗切り替えボタン */}
        <HStack gap={2} bg="white" p={1} borderRadius="md" boxShadow="xs">
          <Button
            size="sm"
            variant={selectedStore === "hamazushi" ? "solid" : "ghost"}
            colorPalette={selectedStore === "hamazushi" ? "blue" : "gray"}
            onClick={() => handleSelectStore("hamazushi")}
            disabled={isRolling}
          >
            はま寿司
          </Button>
          <Button
            size="sm"
            variant={selectedStore === "sushiro" ? "solid" : "ghost"}
            colorPalette={selectedStore === "sushiro" ? "red" : "gray"}
            onClick={() => handleSelectStore("sushiro")}
            disabled={isRolling}
          >
            スシロー
          </Button>
        </HStack>

        <Button onClick={handleDelete}>
          <XCircle size={16} />
          候補から外す
        </Button>
      </Flex>

      <VStack
        h="200px"
        display="flex"
        justifyContent="center"
        alignItems="center"
        flex={1}
      >
        {!isRolling &&
          currentMenu.price > 0 &&
          (sushiCounts[currentMenu.name] || 1) && (
            <Text fontWeight="bold">{currentMenu.genre}</Text>
          )}

        <HStack>
          <Text
            fontSize={isRolling ? "2xl" : "4xl"}
            fontWeight="bold"
            color={isRolling ? "black" : getPriceColor(currentMenu.price)}
            textAlign="center"
          >
            {currentMenu.name}
          </Text>

          {!isRolling &&
            currentMenu.price > 0 &&
            (sushiCounts[currentMenu.name] || 1) && (
              <Badge
                colorPalette="green"
                variant="surface"
                fontSize="2xl"
                px={4}
                py={4}
                borderRadius="full"
              >
                x {sushiCounts[currentMenu.name]}
              </Badge>
            )}
        </HStack>

        {!isRolling && currentMenu.price > 0 && (
          <Text fontSize="3xl" color="gray.600" mt={4}>
            税込み{currentMenu.price}円
          </Text>
        )}
      </VStack>

      <Box w="100%" textAlign="center" margin={2}>
        <Button size="2xl" onClick={handleGacha}>
          🎲ガチャを引く
        </Button>
      </Box>
      <Toaster />
    </VStack>
  );
}

export default App;
