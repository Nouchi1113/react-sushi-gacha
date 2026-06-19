import { Badge, Box, Center, Flex, Text, VStack } from "@chakra-ui/react"
import type { SushiItem } from "../menu/hamazushi"
import { getPriceColor } from "../utils/price"


type ModalMenuListProps = {
    menus: SushiItem[]
    sushiCounts: Record<string, number>
    onClose: () => void
}

export default function ModalMenuList({ menus, sushiCounts = {}, onClose }: ModalMenuListProps) {

    return (
        <>
            <Box position='fixed' top={0} left={0} w='100vw' h='100vh' bg='rgba(0, 0, 0, 0.6)' zIndex={1000} onClick={onClose}>
                <Center h='100%'>

                    <VStack
                        bg='white'
                        w={{ base: "90vw", sm: "450px" }}
                        maxH='90vh'
                        padding={2}
                        overflowY='auto'
                        gap={2}
                        align='stretch'
                        borderRadius='xl'
                        onClick={(e) => e.stopPropagation()}
                        alignItems='start'
                    >
                        <Text w='100%' fontWeight='extrabold' fontSize='2xl' textAlign="center" color="gray.800">メニュー一覧</Text>

                        {menus.map((menu, index) => {
                            const prevMenu = menus[index - 1];
                            const isNewGenre = !prevMenu || prevMenu.genre !== menu.genre

                            const eatenCounts = sushiCounts[menu.name] || 0;

                            return (
                                <>
                                    {isNewGenre && (
                                        <Flex justify='space-between' w='100%'>
                                            <Text mt={6} fontSize='large' fontWeight='bold' >{menu.genre}</Text>
                                            <Text mt={6} fontSize='large' fontWeight='bold'>{menus.filter((m) => m.genre === menu.genre).length}品</Text>
                                        </Flex>
                                    )}
                                    <Flex justify='space-between' align='center' w='100%'>
                                        <Flex>
                                            <Text color={getPriceColor(menu.price)} key={index}>・{menu.name}</Text>
                                            {eatenCounts > 0 && (
                                                <Badge colorPalette="green" variant="subtle" borderRadius="md">
                                                    {eatenCounts}回
                                                </Badge>
                                            )}
                                        </Flex>




                                        <Text color={getPriceColor(menu.price)} fontWeight='bold' key={index}>{menu.price}円</Text>
                                    </Flex>

                                </>
                            )
                        })}
                    </VStack>

                </Center>
            </Box>

        </>


    )
}
