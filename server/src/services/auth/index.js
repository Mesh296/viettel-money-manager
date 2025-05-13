const { refreshToken } = require('../../models')
const { User } = require('../../models')
const { randomBytes } = require('crypto')


const generateRefreshToken = async(user) => {
    const token = randomBytes(20).toString('hex')
    const userId = user?.id

    await refreshToken.create({token, userId})
    return token
}

const isRefreshTokenExpired = async(token) => {
    const refreshToken = await refreshToken.findOne({
        where: {token}
    })

    if (refreshToken) {
        const tokenData = refreshToken.toJSON()

        const currentDate = new Date()
        const timeDelta = currentDate - tokenData.updatedAt.getTime()

        if (timeDelta > 0 && timeDelta < 3600000) {
            return { userId: tokenData.userId, isExpired: false }
        }

        return { userId: null, isExpired: true }
    }

    return { userId: null, isExpired: true }
}

const refreshToken = async (refreshToken) => {
    try {
        const { userId, isExpired } = await isRefreshTokenExpired(refreshToken)

        if (!isExpired && userId) {

            const user = await User.findByPk(userId)

            const accessToken = jwt.sign({ id: userId?.toString() }, SECRET_KEY, {
                expiresIn: '2 days',
            });

            const refreshTokenService = new RefreshTokenService(user)

            const refreshToken = await refreshTokenService.generateRefreshToken()

            return { refreshToken: refreshToken, token: accessToken };
        } else {
            throw new Error('Invalid credentials')
        }
    } catch (error) {
        throw error;
    }
}

module.exports = { generateRefreshToken, refreshToken }