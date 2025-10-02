const mongoose=require('mongoose');
require('dotenv').config();

const URL =process.env.URL;
const connectdb=()=>{
    mongoose.connect(URL)
    .then(()=>{console.log('Connected to DB')})
    .catch((error)=> {
        console.log("DB not connected");
        process.exit(1);

    })
}

module.exports =connectdb;