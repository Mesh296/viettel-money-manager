const bcrypt = require('bcrypt')

const checkPassword = (user, password) => {
    return bcrypt.compareSync(password, user.password)
}

module.exports = checkPassword;