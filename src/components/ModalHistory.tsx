import { Box, Center, Flex, HStack, Text, VStack } from "@chakra-ui/react"
import type { SushiItem } from "../menu/hamazushi"
import { getPriceColor } from "../utils/price"

type ModalHistoryProps = {
    history: SushiItem[]
    onClose: () => void
}

export default function ModalHisotry({ history, onClose }: ModalHistoryProps) {
    const totalPrice = history.reduce((sum, element) => sum + element.price, 0)

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

                        <Text w='100%' fontWeight='extrabold' fontSize='2xl' textAlign="center" color="gray.800">履歴一覧</Text>
                        <Text w='100%' fontWeight='bold' fontSize='xl' textAlign="center" color="gray.800">合計：{totalPrice}円</Text>
                        {history.map((menu, index) => {
                            return (
                                <Flex justify='space-between' align='center' w='100%'>
                                    <Text color={getPriceColor(menu.price)} fontWeight='bold' key={index}>・{menu.name}</Text>
                                    <Text color={getPriceColor(menu.price)} fontWeight='bold' key={index}>{menu.price}円</Text>
                                </Flex>
                            )
                        })}
                    </VStack>
                </Center>
            </Box>

        </>


    )
}
