const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv')
const db = require('./src/providers/db.js');
const { sequelize } = require('./src/models/index.js')

const app = express();
app.use(cors());
app.use(express.json());

dotenv.config();
const port = process.env.PORT;

app.get('/', (req, res) => {
    res.json('Hello World');
});

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`)
});

(async () => {
    try {
        await sequelize.sync({ force: false });
        console.log('All models were synchronized successfully');
    } catch (error) {
        console.error("Error synchronizing models:", error);
    }
})();