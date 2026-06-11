import { Box, Center, Text, VStack } from "@chakra-ui/react"
import type { SushiItem } from "../menu/hamazushi"
import { getPriceColor } from "../utils/price"

type ModalMenuListProps = {
    menus: SushiItem[]
    onClose: () => void
}

export default function ModalMenuList({ menus, onClose }: ModalMenuListProps) {
    return (
        <>
            <Box position='fixed' top={0} left={0} w='100vw' h='100vh' bg='rgba(0, 0, 0, 0.6)' zIndex={1000} onClick={onClose}>
                <Center h='100%'>

                    <VStack
                        bg='white'
                        minW='30vw'
                        maxH='90vh'
                        padding={2}
                        overflowY='auto'
                        gap={2}
                    >
                        <Text fontWeight='bold' fontSize='xl'>メニュー一覧</Text>
                        {menus.map((menu, index) => {
                            return (
                                <Text color={getPriceColor(menu.price)} fontWeight='bold' key={index}>{menu.name}</Text>
                            )
                        })}
                    </VStack>

                </Center>
            </Box>

        </>


    )
}
