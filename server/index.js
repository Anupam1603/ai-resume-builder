const express = require('express')
const cors = require('cors')
const app = express()
const port = 4000

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors())

app.use("/api", (req,res)=> {
    res.send("<h1>HelLo World</h1>")
})
app.listen(port, ()=> {
    console.log(`Server is running on port : ${port}`)
})