const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function connectToDb() {
    try{
        await mongoose.connect(process.env.MONGO_URL);

        console.log("Connected to Database");
    }
    catch(err){
        console.log(err);
    }
}

module.exports = connectToDb;