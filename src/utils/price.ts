export const getPriceColor = (price: number) => {
    if (price >= 319) return '#c53030'
    else if (price >= 231) return '#d97706'
    else if (price >= 176) return '#718096'
    else return 'black'
}
// /#a36d40