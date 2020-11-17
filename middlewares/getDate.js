const getDate = () => {
  return (req, res, next) => {
    const today = new Date()
    let day = today.getDate()
    day = day < 10 ? '0' + day : day
    let month = today.getMonth() + 1
    month = month < 10 ? '0' + month : month
    const year = today.getFullYear()

    req.date = {
      today: {
        string: `${day}-${month}-${year}`
      }
    }
    next()
  }
}

module.exports = getDate