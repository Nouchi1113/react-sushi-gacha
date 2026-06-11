import { Box, Center, HStack, Text, VStack } from "@chakra-ui/react"
import type { SushiItem } from "../menu/hamazushi"
import { getPriceColor } from "../utils/price"

type ModalHistoryProps = {
    history: SushiItem[]
    onClose: () => void
}

export default function ModalHisotry({ history, onClose }: ModalHistoryProps) {
    return (
        <>
            <Box position='fixed' top={0} left={0} w='100vw' h='100vh' bg='rgba(0, 0, 0, 0.6)' zIndex={1000} onClick={onClose}>
                <Center h='100%'>
                    <VStack
                        bg='white'
                        minW='30vw'
                        maxH='90vh'
                        minH='30vh'
                        overflowY='auto'
                        gap={2}>
                        <Text fontWeight='bold' fontSize='xl'>履歴</Text>
                        {history.map((menu, index) => {
                            return (
                                <HStack key={index}>
                                    <Text color={getPriceColor(menu.price)} fontWeight='bold' >{menu.name}</Text>
                                    <Text color={"gray.600"} >税込み{menu.price}円</Text>
                                </HStack>
                            )
                        })}
                    </VStack>
                </Center>
            </Box>

        </>


    )
}
