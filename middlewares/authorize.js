const jwt = require('jsonwebtoken')

const authorize = () => {
  return (req, res, next) => {
    if (!req.headers.authorization) return res.sendStatus(401)
    
    const authorizationHeader = req.headers.authorization.split(' ')
    if (authorizationHeader[0] != 'Bearer') return res.sendStatus(401)
    
    const token = req.headers.authorization.replace('Bearer ', '')
    jwt.verify(token, process.env.AUTH_SECRET, (err, decoded) => {
      if (err) {
        switch (err.name) {
          case 'JsonWebTokenError':
            return res.sendStatus(401)
          default:
            console.log('JWT error:', err.message)
            return res.sendStatus(500)
        }
      }
  
      req.user = {
        email: decoded.email
      }
      next()
    })
  }
}

module.exports = authorize