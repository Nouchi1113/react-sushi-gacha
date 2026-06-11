export const getPriceColor = (price: number) => {
    if (price >= 319) return '#d97706'
    else if (price >= 231) return '#718096'
    else if (price >= 176) return '#a36d40'
    else return 'black'
}