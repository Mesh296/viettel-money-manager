const { RefreshToken } = require('../../models')
const { User } = require('../../models')
const { randomBytes } = require('crypto')
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET

const generateRefreshToken = async(user) => {
    const token = randomBytes(20).toString('hex')
    const userId = user?.id

    await RefreshToken.create({token, userId})
    return token
}

const isRefreshTokenExpired = async(token) => {
    const refreshToken = await RefreshToken.findOne({
        where: {token}
    })

    if (refreshToken) {
        const tokenData = refreshToken.toJSON()

        const currentDate = new Date()
        const timeDelta = currentDate - tokenData.updatedAt.getTime()

        const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;

        if (timeDelta > 0 && timeDelta < REFRESH_TOKEN_EXPIRY) {
            return { userId: tokenData.userId, isExpired: false }
        }

        return { userId: null, isExpired: true }
    }

    return { userId: null, isExpired: true }
}

const refresh = async (refreshToken) => {
    try {
        const { userId, isExpired } = await isRefreshTokenExpired(refreshToken)

        if (!isExpired && userId) {

            const user = await User.findByPk(userId)

            const accessToken = jwt.sign({ id: userId?.toString() }, SECRET_KEY, {
                expiresIn: '2 days',
            });

            const newRefreshToken = await generateRefreshToken(user);

            return { refreshToken: newRefreshToken, token: accessToken };
        } else {
            throw new Error('Failed to refresh token')
        }
    } catch (error) {
        throw error;
    }
}

module.exports = { generateRefreshToken, refresh }